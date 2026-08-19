import {describe, expect, it} from "vitest";
import {envSchema} from "../env.schema.js";

const validEnv = {
    NODE_ENV: "production",
    PORT: "3001",
    DATABASE_URL: "postgresql://user:password@database:5432/fit_track",
    JWT_SECRET: "fit-track-test-secret-that-is-at-least-32-characters",
    CLIENT_URL: "https://fittrack.example",
};

describe("backend environment schema", () => {
    it("normalizes CLIENT_URL to an origin", () => {
        const result = envSchema.parse({
            ...validEnv,
            CLIENT_URL: "https://fittrack.example/",
        });

        expect(result.CLIENT_URL).toBe("https://fittrack.example");
    });

    it.each([
        "ftp://fittrack.example",
        "https://user:password@fittrack.example",
        "https://fittrack.example/app",
        "https://fittrack.example?preview=true",
        "https://fittrack.example#content",
    ])("rejects a CLIENT_URL that is not an HTTP origin: %s", (clientUrl) => {
        expect(envSchema.safeParse({...validEnv, CLIENT_URL: clientUrl}).success).toBe(false);
    });

    it("defaults to trusting no proxy hops", () => {
        expect(envSchema.parse(validEnv).TRUST_PROXY_HOPS).toBe(0);
    });

    it("parses an explicit number of trusted proxy hops", () => {
        expect(envSchema.parse({...validEnv, TRUST_PROXY_HOPS: "2"}).TRUST_PROXY_HOPS).toBe(2);
    });

    it.each(["", "-1", "1.5", "true", "4"])(
        "rejects invalid trusted proxy hops: %s",
        (trustProxyHops) => {
            expect(
                envSchema.safeParse({...validEnv, TRUST_PROXY_HOPS: trustProxyHops}).success,
            ).toBe(false);
        },
    );

    it.each([
        "postgres://user:password@database:5432/fit_track",
        "postgresql://user:password@database:5432/fit_track?schema=public",
    ])("accepts a valid PostgreSQL DATABASE_URL: %s", (databaseUrl) => {
        expect(envSchema.safeParse({...validEnv, DATABASE_URL: databaseUrl}).success).toBe(true);
    });

    it.each([
        "not-a-url",
        "mysql://user:password@database:3306/fit_track",
        "postgresql:///fit_track",
        "postgresql://user:password@database:5432",
        "postgresql://user:password@database:5432/fit_track#fragment",
    ])("rejects an invalid PostgreSQL DATABASE_URL: %s", (databaseUrl) => {
        expect(envSchema.safeParse({...validEnv, DATABASE_URL: databaseUrl}).success).toBe(false);
    });
});
