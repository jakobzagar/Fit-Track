import express from "express";
import request from "supertest";
import {describe, expect, it} from "vitest";
import {z} from "zod";

const clientIpResponseSchema = z.object({clientIp: z.string()});

function createTestApp(trustedProxyHops: number) {
    const app = express();

    app.set("trust proxy", trustedProxyHops);
    app.get("/client-ip", (req, res) => res.status(200).json({clientIp: req.ip}));

    return app;
}

describe("trusted proxy hops", () => {
    it("ignores a forwarded client address when no proxy is trusted", async () => {
        const response = await request(createTestApp(0))
            .get("/client-ip")
            .set("X-Forwarded-For", "203.0.113.10");
        const body = clientIpResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.clientIp).not.toBe("203.0.113.10");
    });

    it("uses the forwarded client address behind one trusted proxy", async () => {
        const response = await request(createTestApp(1))
            .get("/client-ip")
            .set("X-Forwarded-For", "203.0.113.10");
        const body = clientIpResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body).toEqual({clientIp: "203.0.113.10"});
    });

    it("uses the original client address behind two trusted proxies", async () => {
        const response = await request(createTestApp(2))
            .get("/client-ip")
            .set("X-Forwarded-For", "203.0.113.10, 10.0.0.5");
        const body = clientIpResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body).toEqual({clientIp: "203.0.113.10"});
    });
});
