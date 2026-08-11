import {describe, expect, test} from "vitest";
import {messageResponseSchema, validationErrorResponseSchema} from "./response.schemas.js";

describe("common response schemas", () => {
    test("accepts a message response", () => {
        expect(messageResponseSchema.parse({message: "Resource not found"})).toEqual({
            message: "Resource not found",
        });
    });

    test("accepts field validation errors", () => {
        expect(
            validationErrorResponseSchema.parse({
                message: "Validation failed",
                errors: {name: ["Name is required"]},
            }),
        ).toEqual({
            message: "Validation failed",
            errors: {name: ["Name is required"]},
        });
    });

    test("rejects malformed validation errors", () => {
        expect(
            validationErrorResponseSchema.safeParse({
                message: "Validation failed",
                errors: {name: "Name is required"},
            }).success,
        ).toBe(false);
    });
});
