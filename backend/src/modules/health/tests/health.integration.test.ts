import request from "supertest";
import {describe, expect, it, vi} from "vitest";
import {livenessResponseSchema, readinessResponseSchema} from "@fit-track/shared/health";
import {app} from "../../../app.js";
import {prisma} from "../../../db/prisma.js";

describe("health endpoints", () => {
    it("reports that the API process is live", async () => {
        const response = await request(app).get("/api/health/live");

        expect(response.status).toBe(200);
        expect(livenessResponseSchema.parse(response.body)).toEqual({status: "ok"});
    });

    it("reports readiness when the database is reachable", async () => {
        const response = await request(app).get("/api/health/ready");

        expect(response.status).toBe(200);
        expect(readinessResponseSchema.parse(response.body)).toEqual({status: "ready"});
    });

    it("reports unavailable when the database is unreachable", async () => {
        vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("Database unavailable"));

        const response = await request(app).get("/api/health/ready");

        expect(response.status).toBe(503);
        expect(readinessResponseSchema.parse(response.body)).toEqual({status: "not_ready"});
    });
});
