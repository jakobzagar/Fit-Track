import {afterAll, beforeEach} from "vitest";

if (process.env.NODE_ENV !== "test") {
    throw new Error("Backend tests must run with NODE_ENV=test.");
}

const {clearTestDatabase, disconnectTestDatabase} = await import("./support/database.js");

beforeEach(clearTestDatabase);
afterAll(disconnectTestDatabase);
