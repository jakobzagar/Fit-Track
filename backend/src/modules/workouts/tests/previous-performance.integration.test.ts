import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {previousPerformancesResponseSchema} from "@fit-track/shared/workouts";
import {app} from "../../../app.js";
import {
    authenticated,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
    testOrigin,
} from "../../../test/support/fixtures.js";

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
            startedAt: new Date("2026-07-20T09:00:00.000Z"),
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
            startedAt: new Date("2026-07-25T09:00:00.000Z"),
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

    it("returns one latest performance for each exercise in current workout order", async () => {
        const owner = await createTestUser("multiple-exercises@example.com");
        const squat = await createTestExercise(owner.user.id, {name: "Squat"});
        const benchPress = await createTestExercise(owner.user.id, {name: "Bench press"});
        const current = await createTestWorkout(owner.user.id, {name: "Current"});
        await createTestWorkoutExercise(current.id, benchPress.id, 1);
        await createTestWorkoutExercise(current.id, squat.id, 2);

        const older = await createTestWorkout(owner.user.id, {
            name: "Older",
            status: "COMPLETED",
            startedAt: new Date("2026-07-10T09:00:00.000Z"),
            completedAt: new Date("2026-07-10T10:00:00.000Z"),
        });
        const olderSquat = await createTestWorkoutExercise(older.id, squat.id, 1);
        const olderBenchPress = await createTestWorkoutExercise(older.id, benchPress.id, 2);
        await createTestSet(olderSquat.id, 1, {completedAt: new Date()});
        await createTestSet(olderBenchPress.id, 1, {completedAt: new Date()});

        const latest = await createTestWorkout(owner.user.id, {
            name: "Latest",
            status: "COMPLETED",
            startedAt: new Date("2026-07-20T09:00:00.000Z"),
            completedAt: new Date("2026-07-20T10:00:00.000Z"),
        });
        const latestSquat = await createTestWorkoutExercise(latest.id, squat.id);
        await createTestSet(latestSquat.id, 1, {completedAt: new Date()});

        const response = await authenticated(
            "get",
            `/api/workouts/${current.id}/previous-performances`,
            owner.cookie,
        );
        const body = previousPerformancesResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(
            body.previousPerformances.map(({exerciseId, workoutId}) => ({exerciseId, workoutId})),
        ).toEqual([
            {exerciseId: benchPress.id, workoutId: older.id},
            {exerciseId: squat.id, workoutId: latest.id},
        ]);
    });

    it("returns an empty list when no previous completed performance exists", async () => {
        const owner = await createTestUser("owner@example.com");
        const current = await createTestWorkout(owner.user.id);

        const response = await authenticated(
            "get",
            `/api/workouts/${current.id}/previous-performances`,
            owner.cookie,
        );

        expect(response.status).toBe(200);
        expect(previousPerformancesResponseSchema.parse(response.body)).toEqual({
            previousPerformances: [],
        });
    });

    it("does not expose previous performances through another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const foreignWorkout = await createTestWorkout(other.user.id);

        const response = await authenticated(
            "get",
            `/api/workouts/${foreignWorkout.id}/previous-performances`,
            owner.cookie,
        );

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({message: "Workout not found"});
    });

    it("returns not found for a missing workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const missingWorkoutId = "123e4567-e89b-42d3-a456-426614174099";

        const response = await authenticated(
            "get",
            `/api/workouts/${missingWorkoutId}/previous-performances`,
            owner.cookie,
        );

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({message: "Workout not found"});
    });

    it("validates the workout ID", async () => {
        const owner = await createTestUser("owner@example.com");

        const response = await authenticated(
            "get",
            "/api/workouts/not-a-uuid/previous-performances",
            owner.cookie,
        );

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body).message).toBe(
            "Validation failed",
        );
    });

    it("requires authentication", async () => {
        const response = await request(app)
            .get("/api/workouts/123e4567-e89b-42d3-a456-426614174099/previous-performances")
            .set("Origin", testOrigin);

        expect(response.status).toBe(401);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Authentication required",
        });
    });
});
