import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/auth";
import {
    workoutBaseResponseSchema,
    previousPerformancesResponseSchema,
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

    it("rejects invalid data and unauthenticated requests", async () => {
        const owner = await createTestUser("owner@example.com");
        const invalid = await authenticated("post", "/api/workouts", owner.cookie).send({
            name: "",
            performedAt: "today",
        });
        const unauthenticated = await request(app)
            .post("/api/workouts")
            .set("Origin", testOrigin)
            .send({name: "Push day"});

        expect(invalid.status).toBe(400);
        expect(invalid.body).toMatchObject({message: "Validation failed"});
        expect(unauthenticated.status).toBe(401);
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

    it("does not expose another user's workout and validates the ID", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const foreignWorkout = await createTestWorkout(other.user.id);

        const foreign = await authenticated(
            "get",
            `/api/workouts/${foreignWorkout.id}`,
            owner.cookie,
        );
        const invalid = await authenticated("get", "/api/workouts/not-a-uuid", owner.cookie);

        expect(foreign.status).toBe(404);
        expect(messageResponseSchema.parse(foreign.body)).toEqual({message: "Workout not found"});
        expect(invalid.status).toBe(400);
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

    it("rejects empty updates and changes to another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);

        const empty = await authenticated(
            "patch",
            `/api/workouts/${workout.id}`,
            owner.cookie,
        ).send({});
        const foreign = await authenticated(
            "patch",
            `/api/workouts/${workout.id}`,
            owner.cookie,
        ).send({name: "Changed"});

        expect(empty.status).toBe(400);
        expect(foreign.status).toBe(404);
    });

    it("deletes an owned workout and its nested records", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const workoutExercise = await createTestWorkoutExercise(workout.id, exercise.id);
        await createTestSet(workoutExercise.id);

        const response = await authenticated("delete", `/api/workouts/${workout.id}`, owner.cookie);

        expect(response.status).toBe(200);
        expect(messageResponseSchema.parse(response.body)).toEqual({
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

describe("workout lifecycle", () => {
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

describe("GET /api/workouts/:workoutId/previous-performances", () => {
    it("returns the latest completed performance and only its completed sets", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const exercise = await createTestExercise(owner.user.id);
        const current = await createTestWorkout(owner.user.id, {name: "Current"});
        await createTestWorkoutExercise(current.id, exercise.id);
        const previous = await createTestWorkout(owner.user.id, {
            name: "Previous",
            status: "COMPLETED",
            completedAt: new Date("2026-07-20T10:00:00.000Z"),
        });
        const previousExercise = await createTestWorkoutExercise(previous.id, exercise.id);
        const completedSet = await createTestSet(previousExercise.id, 1, {
            completedAt: new Date(),
        });
        await createTestSet(previousExercise.id, 2, {completedAt: null});
        const foreign = await createTestWorkout(other.user.id, {
            name: "Foreign newer performance",
            status: "COMPLETED",
            completedAt: new Date("2026-07-25T10:00:00.000Z"),
        });
        const foreignExercise = await createTestWorkoutExercise(foreign.id, exercise.id);
        await createTestSet(foreignExercise.id, 1, {completedAt: new Date()});

        const response = await authenticated(
            "get",
            `/api/workouts/${current.id}/previous-performances`,
            owner.cookie,
        );
        const body = previousPerformancesResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.previousPerformances).toHaveLength(1);
        expect(body.previousPerformances[0]).toMatchObject({
            exerciseId: exercise.id,
            workoutId: previous.id,
        });
        expect(body.previousPerformances[0]?.sets.map((set) => set.id)).toEqual([completedSet.id]);
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
