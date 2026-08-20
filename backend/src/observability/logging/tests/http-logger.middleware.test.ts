import {PassThrough} from "node:stream";
import express from "express";
import request from "supertest";
import {describe, expect, it} from "vitest";
import {createHttpLogger} from "../http-logger.middleware.js";
import {createLogger} from "../logger.js";

describe("HTTP logger", () => {
    it("correlates a sanitized request summary with its response", async () => {
        const stream = new PassThrough();
        let output = "";
        stream.on("data", (chunk: Buffer) => {
            output += chunk.toString();
        });
        const testLogger = createLogger({environment: "production", level: "info"}, stream);
        const app = express();
        app.use(createHttpLogger(testLogger));
        app.get("/resource", (_req, res) => res.status(204).end());

        const response = await request(app).get("/resource?token=must-not-be-logged");
        await new Promise<void>((resolve) => setImmediate(resolve));
        testLogger.flush();

        const record = JSON.parse(output.trim()) as Record<string, unknown>;
        const requestId = response.headers["x-request-id"] as string;

        expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
        expect(record).toMatchObject({
            requestId,
            req: {
                id: requestId,
                method: "GET",
                path: "/resource",
            },
            res: {
                statusCode: 204,
            },
            msg: "request completed",
        });
        expect(record.responseTimeMs).toEqual(expect.any(Number));
        expect(output).not.toContain("must-not-be-logged");
    });
});
