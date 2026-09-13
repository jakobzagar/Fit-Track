import {PassThrough} from "node:stream";
import express from "express";
import request from "supertest";
import {describe, expect, it, vi} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {createHttpLogger} from "../../../observability/logging/http-logger.middleware.js";
import {createLogger, logger} from "../../../observability/logging/logger.js";
import {errorMiddleware} from "../error.middleware.js";

describe("unexpected API errors", () => {
    it("returns a sanitized response without exposing the error or stack trace", async () => {
        const app = express();
        const error = new Error("database password leaked in stack");
        const loggerError = vi.spyOn(logger, "error");
        app.get("/failure", () => {
            throw error;
        });
        app.use(errorMiddleware);

        const response = await request(app).get("/failure");

        expect(response.status).toBe(500);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Internal server error",
        });
        expect(JSON.stringify(response.body)).not.toContain(error.message);
        expect(JSON.stringify(response.body)).not.toContain("stack");
        expect(loggerError).toHaveBeenCalledWith({err: error}, "unhandled request error");
    });

    it("redacts secrets embedded in an unexpected error message and stack", async () => {
        const stream = new PassThrough();
        let output = "";
        stream.on("data", (chunk: Buffer) => {
            output += chunk.toString();
        });
        const testLogger = createLogger({environment: "production", level: "info"}, stream);
        const app = express();
        const secrets = {
            urlPassword: "LEAK_SENTINEL_URL_PASSWORD",
            bearer: "LEAK_SENTINEL_BEARER_TOKEN",
            jwt: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJMRUFLX1NFTlRJTkVMIn0.signature",
            connectionPassword: "LEAK_SENTINEL_CONNECTION_PASSWORD",
            queryToken: "LEAK_SENTINEL_QUERY_TOKEN",
        };
        const error = new Error(
            [
                `postgresql://database-user:${secrets.urlPassword}@database:5432/fit_track`,
                `Bearer ${secrets.bearer}`,
                secrets.jwt,
                `Server=database;User Id=database-user;Password=${secrets.connectionPassword};Database=fit_track`,
            ].join(" "),
        );
        error.stack = `${error.name}: ${error.message}\n    at https://example.test/callback?token=${secrets.queryToken}`;

        app.use(createHttpLogger(testLogger));
        app.get("/failure", () => {
            throw error;
        });
        app.use(errorMiddleware);

        await request(app).get("/failure");
        await new Promise<void>((resolve) => setImmediate(resolve));
        testLogger.flush();

        for (const secret of Object.values(secrets)) {
            expect(output).not.toContain(secret);
        }
        expect(output).toContain("[REDACTED]");
    });
});
