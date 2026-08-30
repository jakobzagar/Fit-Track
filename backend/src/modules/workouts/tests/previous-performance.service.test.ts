import {beforeEach, describe, expect, it, vi} from "vitest";

const prismaMocks = vi.hoisted(() => ({
    workoutFindFirst: vi.fn(),
    workoutExerciseFindFirst: vi.fn(),
    workoutExerciseFindMany: vi.fn(),
}));

vi.mock("../../../db/prisma.js", () => ({
    prisma: {
        workout: {
            findFirst: prismaMocks.workoutFindFirst,
        },
        workoutExercise: {
            findFirst: prismaMocks.workoutExerciseFindFirst,
            findMany: prismaMocks.workoutExerciseFindMany,
        },
    },
}));

import {getPreviousPerformancesService} from "../services/workout.service.js";

describe("getPreviousPerformancesService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaMocks.workoutFindFirst.mockResolvedValue({
            workoutExercises: [{exerciseId: "exercise-1"}, {exerciseId: "exercise-2"}],
        });
        prismaMocks.workoutExerciseFindFirst.mockResolvedValue(null);
        prismaMocks.workoutExerciseFindMany.mockResolvedValue([]);
    });

    it("loads previous performances for all exercises in one batch", async () => {
        await getPreviousPerformancesService("user-1", "workout-current");

        expect(prismaMocks.workoutExerciseFindMany).toHaveBeenCalledOnce();
        expect(prismaMocks.workoutExerciseFindFirst).not.toHaveBeenCalled();
    });

    it("keeps the latest performance for each exercise in current workout order", async () => {
        prismaMocks.workoutFindFirst.mockResolvedValue({
            workoutExercises: [{exerciseId: "exercise-2"}, {exerciseId: "exercise-1"}],
        });
        prismaMocks.workoutExerciseFindMany.mockResolvedValue([
            {
                exerciseId: "exercise-1",
                workoutId: "workout-latest-1",
                workout: {performedAt: new Date("2026-08-20T00:00:00.000Z")},
                sets: [{id: "set-latest-1"}],
            },
            {
                exerciseId: "exercise-2",
                workoutId: "workout-latest-2",
                workout: {performedAt: new Date("2026-08-19T00:00:00.000Z")},
                sets: [{id: "set-latest-2"}],
            },
            {
                exerciseId: "exercise-1",
                workoutId: "workout-older-1",
                workout: {performedAt: new Date("2026-08-10T00:00:00.000Z")},
                sets: [{id: "set-older-1"}],
            },
        ]);

        const performances = await getPreviousPerformancesService("user-1", "workout-current");

        expect(performances.map(({exerciseId, workoutId}) => ({exerciseId, workoutId}))).toEqual([
            {exerciseId: "exercise-2", workoutId: "workout-latest-2"},
            {exerciseId: "exercise-1", workoutId: "workout-latest-1"},
        ]);
    });
});
