import {describe, expect, it} from "vitest";
import {createAuthCookieOptions} from "./auth.cookie.js";

describe("authentication cookie options", () => {
    it("uses secure HTTP-only cookies in production", () => {
        expect(createAuthCookieOptions("production")).toMatchObject({
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
        });
    });

    it("allows HTTP only outside production", () => {
        expect(createAuthCookieOptions("development").secure).toBe(false);
        expect(createAuthCookieOptions("test").secure).toBe(false);
    });
});
