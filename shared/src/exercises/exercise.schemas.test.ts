import {describe, expect, test} from "vitest";

// Exercise contract behavior and boundary cases.
import {
    createExerciseSchema,
    exerciseIdSchema,
    getExercisesQuerySchema,
    updateExerciseSchema,
} from "./exercise.schemas.js";

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
