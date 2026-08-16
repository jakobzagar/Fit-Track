import {describe, expect, test} from "vitest";
import {livenessResponseSchema, readinessResponseSchema} from "../schemas/health.schemas.js";

describe("health response schemas", () => {
    test("accepts liveness and both readiness states", () => {
        expect(livenessResponseSchema.safeParse({status: "ok"}).success).toBe(true);
        expect(readinessResponseSchema.safeParse({status: "ready"}).success).toBe(true);
        expect(readinessResponseSchema.safeParse({status: "not_ready"}).success).toBe(true);
    });

    test("rejects an unknown health state", () => {
        expect(readinessResponseSchema.safeParse({status: "unknown"}).success).toBe(false);
    });

    test("rejects additional health response fields", () => {
        expect(
            readinessResponseSchema.safeParse({status: "ready", database: "internal"}).success,
        ).toBe(false);
    });
});
