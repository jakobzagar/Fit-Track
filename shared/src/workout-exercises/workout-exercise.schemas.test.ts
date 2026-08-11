import {describe, expect, test} from "vitest";

import {
    addExerciseToWorkoutSchema,
    createWorkoutSetSchema,
    deleteWorkoutSetResponseSchema,
    setWorkoutSetCompletionSchema,
    updateWorkoutExerciseSchema,
    updateWorkoutSetSchema,
    workoutSetIdParamsSchema,
} from "./workout-exercise.schemas.js";

describe("addExerciseToWorkoutSchema", () => {
    test("accepts a valid exercise and trims notes", () => {
        expect(
            addExerciseToWorkoutSchema.parse({
                exerciseId: "123e4567-e89b-42d3-a456-426614174000",
                notes: "  Focus on control ",
            }),
        ).toEqual({
            exerciseId: "123e4567-e89b-42d3-a456-426614174000",
            notes: "Focus on control",
        });
    });

    test("rejects an invalid exercise ID", () => {
        expect(addExerciseToWorkoutSchema.safeParse({exerciseId: "invalid"}).success).toBe(false);
    });
});

describe("createWorkoutSetSchema", () => {
    test.each([
        ["a repetition set", {reps: 10, weight: 80}],
        ["a duration set", {durationSeconds: 60}],
        ["a bodyweight set", {reps: 12, weight: 0}],
    ])("accepts %s", (_case, input) => {
        expect(createWorkoutSetSchema.safeParse(input).success).toBe(true);
    });

    test.each([
        ["missing reps and duration", {weight: 80}],
        ["negative weight", {reps: 10, weight: -1}],
        ["fractional reps", {reps: 10.5}],
        ["zero duration", {durationSeconds: 0}],
        ["weight with excessive precision", {reps: 10, weight: 80.123}],
        ["weight above the database limit", {reps: 10, weight: 1_000_000}],
    ])("rejects %s", (_case, input) => {
        expect(createWorkoutSetSchema.safeParse(input).success).toBe(false);
    });
});

describe("workout exercise and set updates", () => {
    test("requires at least one workout exercise field", () => {
        expect(updateWorkoutExerciseSchema.safeParse({}).success).toBe(false);
        expect(updateWorkoutExerciseSchema.safeParse({position: 2}).success).toBe(true);
    });

    test("allows workout set values to be cleared", () => {
        expect(updateWorkoutSetSchema.safeParse({reps: null, weight: null}).success).toBe(true);
    });

    test("rejects an empty workout set update", () => {
        expect(updateWorkoutSetSchema.safeParse({}).success).toBe(false);
    });

    test("requires an explicit completion state", () => {
        expect(setWorkoutSetCompletionSchema.safeParse({reps: 10}).success).toBe(false);
        expect(setWorkoutSetCompletionSchema.safeParse({reps: 10, completed: true}).success).toBe(
            true,
        );
    });
});

describe("workout set parameters", () => {
    test("accepts all required UUID parameters", () => {
        expect(
            workoutSetIdParamsSchema.safeParse({
                workoutId: "123e4567-e89b-42d3-a456-426614174000",
                workoutExerciseId: "123e4567-e89b-42d3-a456-426614174001",
                setId: "123e4567-e89b-42d3-a456-426614174002",
            }).success,
        ).toBe(true);
    });

    test("rejects a missing set ID", () => {
        expect(
            workoutSetIdParamsSchema.safeParse({
                workoutId: "123e4567-e89b-42d3-a456-426614174000",
                workoutExerciseId: "123e4567-e89b-42d3-a456-426614174001",
            }).success,
        ).toBe(false);
    });
});

describe("workout exercise responses", () => {
    test("rejects additional response fields", () => {
        expect(
            deleteWorkoutSetResponseSchema.safeParse({message: "Set deleted", deletedId: "hidden"})
                .success,
        ).toBe(false);
    });
});
