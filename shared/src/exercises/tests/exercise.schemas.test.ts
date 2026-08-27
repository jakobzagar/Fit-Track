import {describe, expect, test} from "vitest";

import {
    createExerciseSchema,
    exerciseSummarySchema,
    exerciseSchema,
    exerciseIdSchema,
    exerciseStatusSchema,
    getExercisesQuerySchema,
    updateExerciseSchema,
} from "../schemas/exercise.schemas.js";

const validExercise = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    userId: "123e4567-e89b-42d3-a456-426614174001",
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    isArchived: false,
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};

describe("createExerciseSchema", () => {
    test("accepts and trims a valid exercise", () => {
        expect(
            createExerciseSchema.parse({
                name: "  Bench press ",
                muscleGroup: " Chest ",
                equipment: " Barbell ",
            }),
        ).toEqual({name: "Bench press", muscleGroup: "Chest", equipment: "Barbell"});
    });

    test.each([
        ["name", {name: " ", muscleGroup: "Chest"}],
        ["muscle group", {name: "Bench press", muscleGroup: " "}],
        ["equipment", {name: "Bench press", muscleGroup: "Chest", equipment: " "}],
        ["long name", {name: "a".repeat(101), muscleGroup: "Chest"}],
        ["long muscle group", {name: "Bench press", muscleGroup: "a".repeat(101)}],
        ["long equipment", {name: "Bench press", muscleGroup: "Chest", equipment: "a".repeat(101)}],
        ["unknown field", {name: "Bench press", muscleGroup: "Chest", ownerId: "unexpected"}],
    ])("rejects an invalid %s", (_field, input) => {
        expect(createExerciseSchema.safeParse(input).success).toBe(false);
    });
});

describe("updateExerciseSchema", () => {
    test("accepts a partial update", () => {
        expect(updateExerciseSchema.parse({name: "  Incline press "})).toEqual({
            name: "Incline press",
        });
    });

    test("allows equipment to be cleared", () => {
        expect(updateExerciseSchema.safeParse({equipment: null}).success).toBe(true);
    });

    test("rejects an empty update", () => {
        expect(updateExerciseSchema.safeParse({}).success).toBe(false);
    });

    test("rejects an unknown update field", () => {
        expect(
            updateExerciseSchema.safeParse({name: "Incline press", ownerId: "unexpected"}).success,
        ).toBe(false);
    });
});

describe("exercise request parameters", () => {
    test("defaults the exercise status to active", () => {
        expect(getExercisesQuerySchema.parse({})).toEqual({status: "active"});
    });

    test("accepts archived status", () => {
        expect(exerciseStatusSchema.safeParse("archived").success).toBe(true);
        expect(getExercisesQuerySchema.safeParse({status: "archived"}).success).toBe(true);
    });

    test("rejects unknown query and parameter fields", () => {
        expect(getExercisesQuerySchema.safeParse({status: "active", page: 1}).success).toBe(false);
        expect(
            exerciseIdSchema.safeParse({
                exerciseId: "123e4567-e89b-42d3-a456-426614174000",
                nestedId: "unexpected",
            }).success,
        ).toBe(false);
    });

    test("rejects an invalid exercise ID", () => {
        expect(exerciseIdSchema.safeParse({exerciseId: "not-a-uuid"}).success).toBe(false);
    });
});

describe("exercise responses", () => {
    test("projects the exercise fields embedded in a workout", () => {
        const summary = {
            id: validExercise.id,
            name: validExercise.name,
            muscleGroup: validExercise.muscleGroup,
            equipment: validExercise.equipment,
        };

        expect(exerciseSummarySchema.parse(summary)).toEqual(summary);
        expect(exerciseSummarySchema.safeParse({...summary, isArchived: false}).success).toBe(
            false,
        );
    });

    test("rejects additional exercise fields", () => {
        expect(exerciseSchema.safeParse({...validExercise, internalNote: "hidden"}).success).toBe(
            false,
        );
    });
});
