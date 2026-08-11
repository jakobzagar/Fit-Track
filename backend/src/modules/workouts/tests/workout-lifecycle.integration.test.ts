import {describe, expect, it} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {workoutBaseResponseSchema} from "@fit-track/shared/workouts";
import {prisma} from "../../../db/prisma.js";
import {
    authenticated,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
} from "../../../test/fixtures.js";

describe("workout lifecycle", () => {
    it("allows only one of two concurrent workout starts to become active", async () => {
        const owner = await createTestUser("owner@example.com");
        const first = await createTestWorkout(owner.user.id, {name: "First"});
        const second = await createTestWorkout(owner.user.id, {name: "Second"});

        const responses = await Promise.all(
            [first, second].map((workout) =>
                authenticated("post", `/api/workouts/${workout.id}/start`, owner.cookie),
            ),
        );
        const successful = responses.find((response) => response.status === 200);
        const conflicted = responses.find((response) => response.status === 409);

        expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
        expect(workoutBaseResponseSchema.parse(successful?.body).workout.status).toBe("ACTIVE");
        expect(messageResponseSchema.parse(conflicted?.body)).toEqual({
            message: "Another workout is already active",
        });
        expect(await prisma.workout.count({where: {userId: owner.user.id, status: "ACTIVE"}})).toBe(
            1,
        );
    });

    it("starts a draft workout and treats repeated starts as idempotent", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);

        const first = await authenticated(
            "post",
            `/api/workouts/${workout.id}/start`,
            owner.cookie,
        );
        const firstBody = workoutBaseResponseSchema.parse(first.body);
        const second = await authenticated(
            "post",
            `/api/workouts/${workout.id}/start`,
            owner.cookie,
        );
        const secondBody = workoutBaseResponseSchema.parse(second.body);

        expect(first.status).toBe(200);
        expect(firstBody.workout.status).toBe("ACTIVE");
        expect(firstBody.workout.startedAt).not.toBeNull();
        expect(secondBody.workout.startedAt).toBe(firstBody.workout.startedAt);
    });

    it("allows only one active workout per user", async () => {
        const owner = await createTestUser("owner@example.com");
        await createTestWorkout(owner.user.id, {status: "ACTIVE", startedAt: new Date()});
        const draft = await createTestWorkout(owner.user.id, {name: "Draft"});

        const response = await authenticated(
            "post",
            `/api/workouts/${draft.id}/start`,
            owner.cookie,
        );

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Another workout is already active",
        });
    });

    it("does not start a completed workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {
            status: "COMPLETED",
            completedAt: new Date(),
        });

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/start`,
            owner.cookie,
        );

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Completed workout cannot be started",
        });
    });

    it("requires an active workout with at least one completed set before finishing", async () => {
        const owner = await createTestUser("owner@example.com");
        const draft = await createTestWorkout(owner.user.id);
        const active = await createTestWorkout(owner.user.id, {
            name: "Active",
            status: "ACTIVE",
            startedAt: new Date(),
        });

        const draftResponse = await authenticated(
            "post",
            `/api/workouts/${draft.id}/finish`,
            owner.cookie,
        );
        const emptyResponse = await authenticated(
            "post",
            `/api/workouts/${active.id}/finish`,
            owner.cookie,
        );

        expect(draftResponse.status).toBe(409);
        expect(messageResponseSchema.parse(draftResponse.body).message).toContain("started");
        expect(emptyResponse.status).toBe(409);
        expect(messageResponseSchema.parse(emptyResponse.body).message).toContain("one set");
    });

    it("finishes an active workout with a completed set", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {
            status: "ACTIVE",
            startedAt: new Date(),
        });
        const exercise = await createTestExercise(owner.user.id);
        const workoutExercise = await createTestWorkoutExercise(workout.id, exercise.id);
        await createTestSet(workoutExercise.id, 1, {completedAt: new Date()});

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/finish`,
            owner.cookie,
        );
        const body = workoutBaseResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.workout.status).toBe("COMPLETED");
        expect(body.workout.completedAt).not.toBeNull();
    });

    it("cancels an active workout back to draft and resets set completion", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {
            status: "ACTIVE",
            startedAt: new Date(),
        });
        const exercise = await createTestExercise(owner.user.id);
        const workoutExercise = await createTestWorkoutExercise(workout.id, exercise.id);
        const workoutSet = await createTestSet(workoutExercise.id, 1, {
            reps: 12,
            weight: 42,
            completedAt: new Date(),
        });

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/cancel`,
            owner.cookie,
        );
        const body = workoutBaseResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.workout).toMatchObject({
            status: "DRAFT",
            startedAt: null,
            completedAt: null,
        });
        const cancelledSet = await prisma.workoutSet.findUniqueOrThrow({
            where: {id: workoutSet.id},
        });
        expect(cancelledSet).toMatchObject({reps: 12, completedAt: null});
        expect(Number(cancelledSet.weight)).toBe(42);
    });

    it.each([
        ["draft", "DRAFT" as const],
        ["completed", "COMPLETED" as const],
    ])("does not cancel a %s workout", async (_label, status) => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {
            status,
            ...(status === "COMPLETED" && {completedAt: new Date()}),
        });

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/cancel`,
            owner.cookie,
        );

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Only an active workout can be cancelled",
        });
    });

    it("reopens a completed workout while preserving its history and set completion", async () => {
        const owner = await createTestUser("owner@example.com");
        const startedAt = new Date("2026-07-26T10:00:00.000Z");
        const workout = await createTestWorkout(owner.user.id, {
            status: "COMPLETED",
            startedAt,
            completedAt: new Date("2026-07-26T11:00:00.000Z"),
        });
        const exercise = await createTestExercise(owner.user.id);
        const workoutExercise = await createTestWorkoutExercise(workout.id, exercise.id);
        const workoutSet = await createTestSet(workoutExercise.id, 1, {
            completedAt: new Date(),
        });

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/reopen`,
            owner.cookie,
        );
        const body = workoutBaseResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.workout).toMatchObject({
            status: "ACTIVE",
            startedAt: startedAt.toISOString(),
            completedAt: null,
        });
        expect(
            (await prisma.workoutSet.findUniqueOrThrow({where: {id: workoutSet.id}})).completedAt,
        ).not.toBeNull();
    });

    it("does not reopen a completed workout while another workout is active", async () => {
        const owner = await createTestUser("owner@example.com");
        await createTestWorkout(owner.user.id, {status: "ACTIVE", startedAt: new Date()});
        const completed = await createTestWorkout(owner.user.id, {
            name: "Completed",
            status: "COMPLETED",
            completedAt: new Date(),
        });

        const response = await authenticated(
            "post",
            `/api/workouts/${completed.id}/reopen`,
            owner.cookie,
        );

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Another workout is already active",
        });
    });

    it("allows only one concurrent start or reopen to become active", async () => {
        const owner = await createTestUser("owner@example.com");
        const draft = await createTestWorkout(owner.user.id, {name: "Draft"});
        const completed = await createTestWorkout(owner.user.id, {
            name: "Completed",
            status: "COMPLETED",
            startedAt: new Date(),
            completedAt: new Date(),
        });

        const responses = await Promise.all([
            authenticated("post", `/api/workouts/${draft.id}/start`, owner.cookie),
            authenticated("post", `/api/workouts/${completed.id}/reopen`, owner.cookie),
        ]);

        expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
        expect(await prisma.workout.count({where: {userId: owner.user.id, status: "ACTIVE"}})).toBe(
            1,
        );
    });

    it("does not transition another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const draft = await createTestWorkout(other.user.id);
        const active = await createTestWorkout(other.user.id, {
            name: "Active",
            status: "ACTIVE",
            startedAt: new Date(),
        });
        const exercise = await createTestExercise(other.user.id);
        const workoutExercise = await createTestWorkoutExercise(active.id, exercise.id);
        await createTestSet(workoutExercise.id, 1, {completedAt: new Date()});

        const start = await authenticated("post", `/api/workouts/${draft.id}/start`, owner.cookie);
        const finish = await authenticated(
            "post",
            `/api/workouts/${active.id}/finish`,
            owner.cookie,
        );
        const cancel = await authenticated(
            "post",
            `/api/workouts/${active.id}/cancel`,
            owner.cookie,
        );
        const completed = await createTestWorkout(other.user.id, {
            name: "Completed",
            status: "COMPLETED",
            completedAt: new Date(),
        });
        const reopen = await authenticated(
            "post",
            `/api/workouts/${completed.id}/reopen`,
            owner.cookie,
        );

        expect(start.status).toBe(404);
        expect(finish.status).toBe(404);
        expect(cancel.status).toBe(404);
        expect(reopen.status).toBe(404);
        await expect(
            prisma.workout.findUniqueOrThrow({where: {id: draft.id}}),
        ).resolves.toMatchObject({status: "DRAFT", startedAt: null});
        await expect(
            prisma.workout.findUniqueOrThrow({where: {id: active.id}}),
        ).resolves.toMatchObject({status: "ACTIVE", completedAt: null});
    });
});
