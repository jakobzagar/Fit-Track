import {describe, expect, it, vi} from "vitest";
import {prisma} from "../../../db/prisma.js";
import {createLogger, logger} from "../../../observability/logging/logger.js";
import {isDatabaseReady} from "../services/health.service.js";

describe("database readiness diagnostics", () => {
    it("does not log an error for a successful database probe", async () => {
        vi.spyOn(prisma, "$queryRaw").mockResolvedValueOnce([{value: 1}]);
        const log = vi.spyOn(logger, "error");

        expect(await isDatabaseReady()).toBe(true);
        expect(log).not.toHaveBeenCalled();
    });

    it("logs the failure code while redacting credentials and preserving unavailable status", async () => {
        const error = Object.assign(
            new Error("Cannot connect to postgresql://user:private-password@database/fittrack"),
            {code: "CERT_HAS_EXPIRED"},
        );
        vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(error);
        let output = "";
        const capture = createLogger(
            {environment: "production", level: "error"},
            {
                write: (chunk: string) => {
                    output += chunk;
                },
            },
        );
        vi.spyOn(logger, "error").mockImplementation(() => {
            capture.error({err: error}, "database readiness check failed");
        });

        expect(await isDatabaseReady()).toBe(false);
        expect(logger.error).toHaveBeenCalledWith({err: error}, "database readiness check failed");
        expect(output).toContain("CERT_HAS_EXPIRED");
        expect(output).toContain("[REDACTED]");
        expect(output).not.toContain("private-password");
    });
});
