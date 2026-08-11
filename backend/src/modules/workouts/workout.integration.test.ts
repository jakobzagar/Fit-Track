import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {
    deleteWorkoutResponseSchema,
    workoutBaseResponseSchema,
    workoutResponseSchema,
    workoutsResponseSchema,
} from "@fit-track/shared/workouts";
import {app} from "../../app.js";
import {prisma} from "../../db/prisma.js";
import {
    authenticated,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
    testOrigin,
} from "../../test/fixtures.js";

describe("POST /api/workouts", () => {
    it("normalizes and creates a draft workout for the authenticated user", async () => {
        const owner = await createTestUser("owner@example.com");
        const performedAt = "2026-07-20";

        const response = await authenticated("post", "/api/workouts", owner.cookie).send({
            name: "  Push day  ",
            notes: "  Heavy session  ",
            performedAt,
        });
        const body = workoutBaseResponseSchema.parse(response.body);

        expect(response.status).toBe(201);
        expect(body.workout).toMatchObject({
            name: "Push day",
            notes: "Heavy session",
            performedAt: "2026-07-20T00:00:00.000Z",
            status: "DRAFT",
            userId: owner.user.id,
        });
    });

    it("rejects invalid data", async () => {
        const owner = await createTestUser("owner@example.com");
        const response = await authenticated("post", "/api/workouts", owner.cookie).send({
            name: "",
            performedAt: "today",
        });

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body).message).toBe(
            "Validation failed",
        );
        expect(await prisma.workout.count()).toBe(0);
    });

    it("requires authentication", async () => {
        const response = await request(app)
            .post("/api/workouts")
            .set("Origin", testOrigin)
            .send({name: "Push day"});

        expect(response.status).toBe(401);
        expect(await prisma.workout.count()).toBe(0);
    });
});

describe("GET /api/workouts", () => {
    it("returns only owned workouts ordered by performed date with exercise counts", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const older = await createTestWorkout(owner.user.id, {
            name: "Older",
            performedAt: new Date("2026-07-01T10:00:00.000Z"),
        });
        const newer = await createTestWorkout(owner.user.id, {
            name: "Newer",
            performedAt: new Date("2026-07-20T10:00:00.000Z"),
        });
        const exercise = await createTestExercise(owner.user.id);
        await createTestWorkoutExercise(newer.id, exercise.id);
        await createTestWorkout(other.user.id, {name: "Hidden"});

        const response = await authenticated("get", "/api/workouts", owner.cookie);
        const body = workoutsResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.workouts.map((workout) => workout.id)).toEqual([newer.id, older.id]);
        expect(body.workouts[0]?._count.workoutExercises).toBe(1);
    });
});

describe("GET /api/workouts/:workoutId", () => {
    it("returns nested exercises and sets in their numeric order", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const firstExercise = await createTestExercise(owner.user.id, {name: "Bench"});
        const secondExercise = await createTestExercise(owner.user.id, {name: "Squat"});
        const second = await createTestWorkoutExercise(workout.id, secondExercise.id, 2);
        const first = await createTestWorkoutExercise(workout.id, firstExercise.id, 1);
        await createTestSet(first.id, 2, {reps: 8});
        await createTestSet(first.id, 1, {reps: 10});

        const response = await authenticated("get", `/api/workouts/${workout.id}`, owner.cookie);
        const body = workoutResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.workout.workoutExercises.map((item) => item.id)).toEqual([first.id, second.id]);
        expect(body.workout.workoutExercises[0]?.sets.map((set) => set.setNumber)).toEqual([1, 2]);
    });

    it("does not expose another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const foreignWorkout = await createTestWorkout(other.user.id);

        const foreign = await authenticated(
            "get",
            `/api/workouts/${foreignWorkout.id}`,
            owner.cookie,
        );
        expect(foreign.status).toBe(404);
        expect(messageResponseSchema.parse(foreign.body)).toEqual({message: "Workout not found"});
    });

    it("validates the workout ID", async () => {
        const owner = await createTestUser("owner@example.com");

        const response = await authenticated("get", "/api/workouts/not-a-uuid", owner.cookie);

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body).message).toBe(
            "Validation failed",
        );
    });
});

describe("PATCH and DELETE /api/workouts/:workoutId", () => {
    it("updates selected fields and allows notes to be cleared", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {notes: "Old notes"});

        const response = await authenticated(
            "patch",
            `/api/workouts/${workout.id}`,
            owner.cookie,
        ).send({name: "  Pull day  ", notes: null});
        const body = workoutBaseResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.workout).toMatchObject({name: "Pull day", notes: null});
    });

    it("rejects an empty update", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);

        const response = await authenticated(
            "patch",
            `/api/workouts/${workout.id}`,
            owner.cookie,
        ).send({});

        expect(response.status).toBe(400);
    });

    it("does not update another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);

        const response = await authenticated(
            "patch",
            `/api/workouts/${workout.id}`,
            owner.cookie,
        ).send({name: "Changed"});

        expect(response.status).toBe(404);
    });

    it("deletes an owned workout and its nested records", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const workoutExercise = await createTestWorkoutExercise(workout.id, exercise.id);
        await createTestSet(workoutExercise.id);

        const response = await authenticated("delete", `/api/workouts/${workout.id}`, owner.cookie);

        expect(response.status).toBe(200);
        expect(deleteWorkoutResponseSchema.parse(response.body)).toEqual({
            message: "Workout deleted successfully",
        });
        expect(await prisma.workout.findUnique({where: {id: workout.id}})).toBeNull();
        expect(await prisma.workoutExercise.count()).toBe(0);
        expect(await prisma.workoutSet.count()).toBe(0);
    });

    it("does not delete another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);

        const response = await authenticated("delete", `/api/workouts/${workout.id}`, owner.cookie);

        expect(response.status).toBe(404);
        expect(await prisma.workout.count()).toBe(1);
    });

    it("keeps completed workouts read-only", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {
            status: "COMPLETED",
            startedAt: new Date(),
            completedAt: new Date(),
        });

        const update = await authenticated(
            "patch",
            `/api/workouts/${workout.id}`,
            owner.cookie,
        ).send({name: "Changed"});
        const deletion = await authenticated("delete", `/api/workouts/${workout.id}`, owner.cookie);

        expect(update.status).toBe(409);
        expect(deletion.status).toBe(409);
        expect(messageResponseSchema.parse(update.body)).toEqual({
            message: "Completed workout is read-only",
        });
        await expect(
            prisma.workout.findUniqueOrThrow({where: {id: workout.id}}),
        ).resolves.toMatchObject({
            name: "Test workout",
            status: "COMPLETED",
        });
    });
});

describe("workout CSRF protection", () => {
    it("rejects state changes from an untrusted origin", async () => {
        const owner = await createTestUser("owner@example.com");

        const response = await request(app)
            .post("/api/workouts")
            .set("Cookie", owner.cookie)
            .set("Origin", "https://attacker.example")
            .send({name: "Blocked"});

        expect(response.status).toBe(403);
        expect(await prisma.workout.count()).toBe(0);
    });
});
