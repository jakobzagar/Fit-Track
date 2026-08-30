import {describe, expect, it} from "vitest";
import {envSchema} from "../env.schema.js";

const validEnv = {
    NODE_ENV: "production",
    PORT: "3001",
    DATABASE_URL: "postgresql://user:password@database:5432/fit_track?sslmode=require",
    JWT_SECRET: "fit-track-test-secret-that-is-at-least-32-characters",
    CLIENT_ORIGIN: "https://fittrack.example",
};

describe("backend environment schema", () => {
    it("normalizes CLIENT_ORIGIN to an origin", () => {
        const result = envSchema.parse({
            ...validEnv,
            CLIENT_ORIGIN: "https://fittrack.example/",
        });

        expect(result.CLIENT_ORIGIN).toBe("https://fittrack.example");
    });

    it.each([
        "ftp://fittrack.example",
        "https://user:password@fittrack.example",
        "https://fittrack.example/app",
        "https://fittrack.example?preview=true",
        "https://fittrack.example#content",
    ])("rejects a CLIENT_ORIGIN that is not an HTTP origin: %s", (clientUrl) => {
        expect(envSchema.safeParse({...validEnv, CLIENT_ORIGIN: clientUrl}).success).toBe(false);
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
        "postgres://user:password@database:5432/fit_track?sslmode=require",
        "postgresql://user:password@database:5432/fit_track?schema=public&sslmode=verify-ca",
        "postgresql://user:password@database:5432/fit_track?sslmode=verify-full",
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

    it.each([
        "postgresql://user:password@database:5432/fit_track",
        "postgresql://user:password@database:5432/fit_track?sslmode=disable",
        "postgresql://user:password@database:5432/fit_track?sslmode=prefer",
    ])("rejects a production database connection without required TLS: %s", (databaseUrl) => {
        expect(envSchema.safeParse({...validEnv, DATABASE_URL: databaseUrl}).success).toBe(false);
    });

    it("allows an explicit insecure database only for controlled production-like environments", () => {
        const result = envSchema.parse({
            ...validEnv,
            DATABASE_URL: "postgresql://user:password@database:5432/fit_track",
            DATABASE_TLS_MODE: "allow-insecure",
        });

        expect(result.DATABASE_TLS_MODE).toBe("allow-insecure");
    });

    it("allows local development without database TLS", () => {
        expect(
            envSchema.safeParse({
                ...validEnv,
                NODE_ENV: "development",
                DATABASE_URL: "postgresql://user:password@localhost:5432/fit_track",
            }).success,
        ).toBe(true);
    });

    it("uses bounded database pool defaults", () => {
        const result = envSchema.parse(validEnv);

        expect(result).toMatchObject({
            DB_POOL_MAX: 5,
            DB_CONNECTION_TIMEOUT_MS: 5_000,
            DB_IDLE_TIMEOUT_MS: 30_000,
        });
    });

    it("uses an info log level by default and accepts an explicit level", () => {
        expect(envSchema.parse(validEnv).LOG_LEVEL).toBe("info");
        expect(envSchema.parse({...validEnv, LOG_LEVEL: "debug"}).LOG_LEVEL).toBe("debug");
    });

    it("rejects an unsupported log level", () => {
        expect(envSchema.safeParse({...validEnv, LOG_LEVEL: "verbose"}).success).toBe(false);
    });

    it("parses explicit database pool settings", () => {
        const result = envSchema.parse({
            ...validEnv,
            DB_POOL_MAX: "8",
            DB_CONNECTION_TIMEOUT_MS: "3000",
            DB_IDLE_TIMEOUT_MS: "45000",
        });

        expect(result).toMatchObject({
            DB_POOL_MAX: 8,
            DB_CONNECTION_TIMEOUT_MS: 3_000,
            DB_IDLE_TIMEOUT_MS: 45_000,
        });
    });

    it.each([
        ["DB_POOL_MAX", "0"],
        ["DB_POOL_MAX", "51"],
        ["DB_CONNECTION_TIMEOUT_MS", "99"],
        ["DB_CONNECTION_TIMEOUT_MS", "60001"],
        ["DB_IDLE_TIMEOUT_MS", "999"],
        ["DB_IDLE_TIMEOUT_MS", "300001"],
    ])("rejects an unsafe database setting %s=%s", (name, value) => {
        expect(envSchema.safeParse({...validEnv, [name]: value}).success).toBe(false);
    });
});
