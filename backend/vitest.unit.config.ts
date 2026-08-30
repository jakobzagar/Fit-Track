import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        exclude: ["src/**/*.integration.test.ts"],
        restoreMocks: true,
        env: {
            NODE_ENV: "test",
            DATABASE_URL: "postgresql://unused:unused@localhost:5432/unused",
            JWT_SECRET: "fit-track-test-secret-that-is-at-least-32-characters",
            CLIENT_ORIGIN: "http://localhost:5173",
            TRUST_PROXY_HOPS: "0",
        },
    },
});
