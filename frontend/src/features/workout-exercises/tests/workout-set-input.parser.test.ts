import {describe, expect, test} from "vitest";
import {parseEditedWorkoutSet, parseNewWorkoutSet} from "../schemas/workout-set-input.parser";

describe("workout set input parsing", () => {
    test("normalizes create and edit values", () => {
        expect(parseNewWorkoutSet({reps: "8", weight: "82.5", durationSeconds: ""})).toEqual({
            success: true,
            data: {reps: 8, weight: 82.5},
        });
        expect(parseEditedWorkoutSet({reps: "", weight: "", durationSeconds: "45"})).toEqual({
            success: true,
            data: {reps: null, weight: null, durationSeconds: 45},
        });
    });

    test.each([
        ["fractional reps", {reps: "8.5", weight: "", durationSeconds: ""}, "reps"],
        ["fractional duration", {reps: "", weight: "", durationSeconds: "4.5"}, "durationSeconds"],
        ["excessive weight", {reps: "8", weight: "1000000", durationSeconds: ""}, "weight"],
        ["weight precision", {reps: "8", weight: "82.555", durationSeconds: ""}, "weight"],
    ])("rejects %s", (_case, values, field) => {
        const result = parseNewWorkoutSet(values);

        expect(result.success).toBe(false);
        if (!result.success)
            expect(result.errors[field as keyof typeof result.errors]).toBeDefined();
    });

    test("requires reps or duration when editing", () => {
        expect(parseEditedWorkoutSet({reps: "", weight: "20", durationSeconds: ""})).toEqual({
            success: false,
            errors: {form: "Either reps or durationSeconds is required"},
        });
    });
});
