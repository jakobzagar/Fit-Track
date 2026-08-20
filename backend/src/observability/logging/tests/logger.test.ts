import {PassThrough} from "node:stream";
import {describe, expect, it} from "vitest";
import {createLogger} from "../logger.js";

function captureLoggerOutput() {
    const stream = new PassThrough();
    let output = "";
    stream.on("data", (chunk: Buffer) => {
        output += chunk.toString();
    });

    return {
        stream,
        records: () =>
            output
                .trim()
                .split("\n")
                .filter(Boolean)
                .map((line) => JSON.parse(line) as Record<string, unknown>),
    };
}

describe("structured logger", () => {
    it("adds stable service metadata and serializes errors", () => {
        const capture = captureLoggerOutput();
        const testLogger = createLogger({environment: "production", level: "info"}, capture.stream);
        const error = new Error("database unavailable");

        testLogger.error({err: error}, "request failed");
        testLogger.flush();

        expect(capture.records()[0]).toMatchObject({
            level: 50,
            service: "fit-track-backend",
            environment: "production",
            msg: "request failed",
            err: {
                type: "Error",
                message: "database unavailable",
            },
        });
    });

    it("redacts credentials and authentication headers", () => {
        const capture = captureLoggerOutput();
        const testLogger = createLogger({environment: "production", level: "info"}, capture.stream);

        testLogger.info(
            {
                password: "secret-password",
                token: "secret-token",
                databaseUrl: "postgresql://user:database-password@database:5432/fit_track",
                jwtSecret: "secret-jwt-signing-key",
                req: {
                    headers: {
                        authorization: "Bearer secret-token",
                        cookie: "token=secret-token",
                    },
                },
            },
            "credentials received",
        );
        testLogger.flush();

        const output = JSON.stringify(capture.records()[0]);
        expect(output).not.toContain("secret-password");
        expect(output).not.toContain("secret-token");
        expect(output).not.toContain("database-password");
        expect(output).not.toContain("secret-jwt-signing-key");
        expect(output).toContain("[REDACTED]");
    });
});
