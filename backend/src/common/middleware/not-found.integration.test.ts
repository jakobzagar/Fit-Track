import request from "supertest";
import {describe, expect, it} from "vitest";
import {app} from "../../app.js";

describe("unknown API routes", () => {
    it("returns the standard JSON error response", async () => {
        const response = await request(app).get("/api/unknown");

        expect(response.status).toBe(404);
        expect(response.type).toBe("application/json");
        expect(response.body).toEqual({message: "Resource not found"});
    });
});
