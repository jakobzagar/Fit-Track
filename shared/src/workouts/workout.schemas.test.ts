import {describe, expect, test} from "vitest";

import {
    createWorkoutSchema,
    updateWorkoutSchema,
    workoutSetSchema,
    workoutStatusSchema,
} from "./workout.schemas.js";

describe("createWorkoutSchema", () => {
    test("accepts and trims a valid workout", () => {
        expect(
            createWorkoutSchema.parse({
                name: "  Push day ",
                notes: "  Heavy session ",
                performedAt: "2026-07-26",
            }),
        ).toEqual({
            name: "Push day",
            notes: "Heavy session",
            performedAt: "2026-07-26",
        });
    });

    test.each([
        ["an empty name", {name: " "}],
        ["a name over 100 characters", {name: "a".repeat(101)}],
        ["an invalid date", {name: "Push day", performedAt: "today"}],
        [
            "a timestamp instead of a calendar date",
            {name: "Push day", performedAt: "2026-07-26T10:00:00.000Z"},
        ],
        ["notes over 1000 characters", {name: "Push day", notes: "a".repeat(1001)}],
    ])("rejects %s", (_case, input) => {
        expect(createWorkoutSchema.safeParse(input).success).toBe(false);
    });
});

describe("updateWorkoutSchema", () => {
    test("accepts a partial update and allows notes to be cleared", () => {
        expect(updateWorkoutSchema.safeParse({notes: null}).success).toBe(true);
    });

    test("rejects an empty update", () => {
        expect(updateWorkoutSchema.safeParse({}).success).toBe(false);
    });
});

describe("workout response values", () => {
    test.each(["DRAFT", "ACTIVE", "COMPLETED"])("accepts the %s status", (status) => {
        expect(workoutStatusSchema.safeParse(status).success).toBe(true);
    });

    test("rejects an unknown workout status", () => {
        expect(workoutStatusSchema.safeParse("PAUSED").success).toBe(false);
    });

    test("coerces a decimal weight returned by Prisma", () => {
        const result = workoutSetSchema.parse({
            id: "123e4567-e89b-42d3-a456-426614174000",
            setNumber: 1,
            reps: 8,
            weight: "82.50",
            durationSeconds: null,
            completedAt: null,
            workoutExerciseId: "123e4567-e89b-42d3-a456-426614174001",
        });

        expect(result.weight).toBe(82.5);
    });

    test("rejects additional set response fields", () => {
        expect(
            workoutSetSchema.safeParse({
                id: "123e4567-e89b-42d3-a456-426614174000",
                setNumber: 1,
                reps: 8,
                weight: 82.5,
                durationSeconds: null,
                completedAt: null,
                workoutExerciseId: "123e4567-e89b-42d3-a456-426614174001",
                internalValue: true,
            }).success,
        ).toBe(false);
    });
});
