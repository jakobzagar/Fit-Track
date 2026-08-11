import {describe, expect, test} from "vitest";

import {
    createExerciseSchema,
    exerciseSchema,
    exerciseIdSchema,
    getExercisesQuerySchema,
    updateExerciseSchema,
} from "./exercise.schemas.js";

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
    ])("rejects an empty %s", (_field, input) => {
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
});

describe("exercise request parameters", () => {
    test("defaults the exercise status to active", () => {
        expect(getExercisesQuerySchema.parse({})).toEqual({status: "active"});
    });

    test("accepts archived status", () => {
        expect(getExercisesQuerySchema.safeParse({status: "archived"}).success).toBe(true);
    });

    test("rejects an invalid exercise ID", () => {
        expect(exerciseIdSchema.safeParse({exerciseId: "not-a-uuid"}).success).toBe(false);
    });
});

describe("exercise responses", () => {
    test("rejects additional exercise fields", () => {
        expect(exerciseSchema.safeParse({...validExercise, internalNote: "hidden"}).success).toBe(
            false,
        );
    });
});
