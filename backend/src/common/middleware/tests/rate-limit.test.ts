import express from "express";
import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {createRateLimiters} from "../rate-limit.middleware.js";

function createTestApp() {
    const app = express();
    const {apiRateLimiter, loginRateLimiter, registerRateLimiter} = createRateLimiters({
        api: 2,
        login: 2,
        register: 2,
    });

    app.use("/api", apiRateLimiter);
    app.get("/api", (_req, res) => res.status(200).json({message: "ok"}));
    app.get("/api/health/live", (_req, res) => res.status(200).json({status: "live"}));
    app.post("/login", loginRateLimiter, (req, res) =>
        req.query.success === "true"
            ? res.status(200).json({message: "ok"})
            : res.status(401).json({message: "invalid"}),
    );
    app.post("/register", registerRateLimiter, (_req, res) =>
        res.status(201).json({message: "created"}),
    );

    return app;
}

describe("rate limiter middleware", () => {
    it("limits general API traffic but skips preflight and health-check requests", async () => {
        const app = createTestApp();

        await request(app).options("/api").expect(200);
        await request(app).get("/api/health/live").expect(200);
        await request(app).get("/api/health/live").expect(200);
        await request(app).get("/api").expect(200);
        await request(app).get("/api").expect(200);
        const limited = await request(app).get("/api");
        const healthCheck = await request(app).get("/api/health/live");

        expect(limited.status).toBe(429);
        expect(messageResponseSchema.parse(limited.body)).toEqual({
            message: "Too many requests. Please try again later",
        });
        expect(limited.headers).toHaveProperty("ratelimit");
        expect(limited.headers).not.toHaveProperty("x-ratelimit-limit");
        expect(healthCheck.status).toBe(200);
        expect(healthCheck.headers).not.toHaveProperty("ratelimit");
    });

    it("counts failed logins but does not count successful logins", async () => {
        const app = createTestApp();

        await request(app).post("/login?success=true").expect(200);
        await request(app).post("/login").expect(401);
        await request(app).post("/login").expect(401);
        const limited = await request(app).post("/login");

        expect(limited.status).toBe(429);
        expect(messageResponseSchema.parse(limited.body)).toEqual({
            message: "Too many failed login attempts. Please try again later",
        });
    });

    it("limits registration attempts regardless of their response status", async () => {
        const app = createTestApp();

        await request(app).post("/register").expect(201);
        await request(app).post("/register").expect(201);
        const limited = await request(app).post("/register");

        expect(limited.status).toBe(429);
        expect(messageResponseSchema.parse(limited.body)).toEqual({
            message: "Too many registration attempts. Please try again later",
        });
    });
});
