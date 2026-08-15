import {describe, expect, it} from "vitest";
import {previousPerformancesResponseSchema} from "@fit-track/shared/workouts";
import {
    authenticated,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
} from "../../../test/fixtures.js";

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
});
