import express from "express";
import request from "supertest";
import {describe, expect, it, vi} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {errorMiddleware} from "../error.middleware.js";

describe("unexpected API errors", () => {
    it("returns a sanitized response without exposing the error or stack trace", async () => {
        const app = express();
        const error = new Error("database password leaked in stack");
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
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
        expect(consoleError).toHaveBeenCalledWith(error);
    });
});
