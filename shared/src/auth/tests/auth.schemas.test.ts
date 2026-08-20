import {describe, expect, test} from "vitest";

import {
    authResponseSchema,
    loginSchema,
    registerSchema,
    userSchema,
} from "../schemas/auth.schemas.js";

const validUser = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    name: "Jakob",
    email: "jakob@example.com",
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};

describe("registerSchema", () => {
    test("accepts and normalizes valid registration data", () => {
        const result = registerSchema.parse({
            name: "  Jakob  ",
            email: "  JAKOB@EXAMPLE.COM  ",
            password: "password123",
        });

        expect(result).toEqual({
            name: "Jakob",
            email: "jakob@example.com",
            password: "password123",
        });
    });

    test.each([
        ["an empty name", {name: "   ", email: "jakob@example.com", password: "password123"}],
        ["an invalid email", {name: "Jakob", email: "invalid", password: "password123"}],
        [
            "an email over 254 characters",
            {name: "Jakob", email: `a@${"b".repeat(249)}.com`, password: "password123"},
        ],
        ["a short password", {name: "Jakob", email: "jakob@example.com", password: "short"}],
        [
            "a password over 72 characters",
            {name: "Jakob", email: "jakob@example.com", password: "a".repeat(73)},
        ],
        [
            "a password over 72 UTF-8 bytes",
            {name: "Jakob", email: "jakob@example.com", password: "é".repeat(37)},
        ],
        [
            "an unknown field",
            {
                name: "Jakob",
                email: "jakob@example.com",
                password: "password123",
                role: "admin",
            },
        ],
    ])("rejects %s", (_case, input) => {
        expect(registerSchema.safeParse(input).success).toBe(false);
    });
});

describe("loginSchema", () => {
    test("accepts and normalizes valid login data", () => {
        const result = loginSchema.parse({
            email: "  JAKOB@EXAMPLE.COM ",
            password: "password123",
        });

        expect(result.email).toBe("jakob@example.com");
    });

    test.each([
        ["an empty password", ""],
        ["a password over 72 characters", "a".repeat(73)],
        ["a password over 72 UTF-8 bytes", "é".repeat(37)],
    ])("rejects %s", (_case, password) => {
        expect(loginSchema.safeParse({email: "jakob@example.com", password}).success).toBe(false);
    });

    test("accepts a password at the bcrypt byte boundary", () => {
        expect(
            loginSchema.safeParse({email: "jakob@example.com", password: "a".repeat(72)}).success,
        ).toBe(true);
        expect(
            loginSchema.safeParse({email: "jakob@example.com", password: "é".repeat(36)}).success,
        ).toBe(true);
    });

    test("rejects an unknown field", () => {
        expect(
            loginSchema.safeParse({
                email: "jakob@example.com",
                password: "password123",
                rememberMe: true,
            }).success,
        ).toBe(false);
    });
});

describe("authentication responses", () => {
    test("accepts a valid serialized user", () => {
        expect(userSchema.safeParse(validUser).success).toBe(true);
        expect(authResponseSchema.safeParse({user: validUser}).success).toBe(true);
    });

    test("rejects a user with non-ISO dates", () => {
        expect(userSchema.safeParse({...validUser, createdAt: "yesterday"}).success).toBe(false);
    });

    test("rejects additional user response fields", () => {
        expect(userSchema.safeParse({...validUser, passwordHash: "must-not-leak"}).success).toBe(
            false,
        );
    });
});
