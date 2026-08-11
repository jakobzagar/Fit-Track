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

    it("does not start or finish another user's workout", async () => {
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

        expect(start.status).toBe(404);
        expect(finish.status).toBe(404);
        await expect(
            prisma.workout.findUniqueOrThrow({where: {id: draft.id}}),
        ).resolves.toMatchObject({status: "DRAFT", startedAt: null});
        await expect(
            prisma.workout.findUniqueOrThrow({where: {id: active.id}}),
        ).resolves.toMatchObject({status: "ACTIVE", completedAt: null});
    });
});
