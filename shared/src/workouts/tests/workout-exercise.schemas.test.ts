import {describe, expect, test} from "vitest";

import {
    addExerciseToWorkoutSchema,
    addSetToWorkoutExerciseResponseSchema,
    deleteWorkoutExerciseResponseSchema,
    createWorkoutSetSchema,
    deleteWorkoutSetResponseSchema,
    setWorkoutSetCompletionSchema,
    updateWorkoutExerciseSchema,
    updateWorkoutSetSchema,
    workoutExerciseDetailsSchema,
    workoutSetIdParamsSchema,
    workoutSetResponseSchema,
} from "../index.js";
import {messageResponseSchema} from "../../common/schemas/response.schemas.js";

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

    test("rejects an unknown field", () => {
        expect(
            addExerciseToWorkoutSchema.safeParse({
                exerciseId: "123e4567-e89b-42d3-a456-426614174000",
                position: 1,
            }).success,
        ).toBe(false);
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
        ["an unknown field", {reps: 10, completed: true}],
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

    test("rejects unknown update and completion fields", () => {
        expect(
            updateWorkoutExerciseSchema.safeParse({position: 2, exerciseId: "hidden"}).success,
        ).toBe(false);
        expect(updateWorkoutSetSchema.safeParse({reps: 10, setNumber: 2}).success).toBe(false);
        expect(
            setWorkoutSetCompletionSchema.safeParse({
                reps: 10,
                completed: true,
                completedAt: "hidden",
            }).success,
        ).toBe(false);
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

    test("rejects an unknown parameter", () => {
        expect(
            workoutSetIdParamsSchema.safeParse({
                workoutId: "123e4567-e89b-42d3-a456-426614174000",
                workoutExerciseId: "123e4567-e89b-42d3-a456-426614174001",
                setId: "123e4567-e89b-42d3-a456-426614174002",
                userId: "hidden",
            }).success,
        ).toBe(false);
    });
});

describe("workout exercise responses", () => {
    test("projects only the exercise fields embedded in a workout", () => {
        const details = {
            id: "123e4567-e89b-42d3-a456-426614174000",
            name: "Bench press",
            muscleGroup: "Chest",
            equipment: "Barbell",
        };

        expect(workoutExerciseDetailsSchema.parse(details)).toEqual(details);
        expect(
            workoutExerciseDetailsSchema.safeParse({...details, isArchived: false}).success,
        ).toBe(false);
    });

    test("rejects additional response fields", () => {
        expect(
            deleteWorkoutSetResponseSchema.safeParse({message: "Set deleted", deletedId: "hidden"})
                .success,
        ).toBe(false);
    });

    test("reuses common and workout-set response contracts", () => {
        expect(deleteWorkoutExerciseResponseSchema).toBe(messageResponseSchema);
        expect(deleteWorkoutSetResponseSchema).toBe(messageResponseSchema);
        expect(addSetToWorkoutExerciseResponseSchema).toBe(workoutSetResponseSchema);
    });
});
