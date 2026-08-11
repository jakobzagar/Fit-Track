import request from "supertest";
import {describe, expect, it, vi} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {app} from "../../app.js";
import {env} from "../../config/env.js";

describe("HTTP security middleware", () => {
    it("allows the configured CORS origin with credentials", async () => {
        const response = await request(app).get("/api/health/live").set("Origin", env.clientUrl);

        expect(response.status).toBe(200);
        expect(response.headers["access-control-allow-origin"]).toBe(env.clientUrl);
        expect(response.headers["access-control-allow-credentials"]).toBe("true");
        expect(response.headers.vary).toContain("Origin");
    });

    it("does not grant CORS access to an untrusted origin", async () => {
        const response = await request(app)
            .get("/api/health/live")
            .set("Origin", "https://attacker.example");

        expect(response.status).toBe(200);
        expect(response.headers).not.toHaveProperty("access-control-allow-origin");
        expect(response.headers).not.toHaveProperty("access-control-allow-credentials");
    });

    it("sets Helmet security headers", async () => {
        const response = await request(app).get("/api/health/live");

        expect(response.status).toBe(200);
        expect(response.headers["content-security-policy"]).toBeDefined();
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
        expect(response.headers["strict-transport-security"]).toBeDefined();
        expect(response.headers).not.toHaveProperty("x-powered-by");
    });

    it("rejects JSON payloads larger than 100kb", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const response = await request(app)
            .post("/api/auth/register")
            .set("Origin", env.clientUrl)
            .send({
                name: "a".repeat(101 * 1024),
                email: "test@example.com",
                password: "password123",
            });

        expect(response.status).toBe(413);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Request payload too large",
        });
        expect(consoleError).not.toHaveBeenCalled();
    });

    it("rejects malformed JSON without exposing parser details", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const response = await request(app)
            .post("/api/auth/register")
            .set("Origin", env.clientUrl)
            .set("Content-Type", "application/json")
            .send('{"name":');

        expect(response.status).toBe(400);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Invalid JSON payload",
        });
        expect(consoleError).not.toHaveBeenCalled();
    });
});
