import {http, HttpResponse} from "msw";
import {z} from "zod";
import {describe, expect, test, vi} from "vitest";
import {API_URL} from "../test/constants";
import {server} from "../test/mocks/server";
import {apiRequest} from "./api.client";

const responseSchema = z.object({value: z.string()});

describe("apiRequest", () => {
    test("sends JSON with credentials and validates the response", async () => {
        server.use(
            http.post(`${API_URL}/example`, async ({request}) => {
                expect(request.credentials).toBe("include");
                expect(request.headers.get("content-type")).toBe("application/json");
                expect(await request.json()).toEqual({name: "FitTrack"});
                return HttpResponse.json({value: "created"});
            }),
        );

        await expect(
            apiRequest("/example", responseSchema, {method: "POST", body: {name: "FitTrack"}}),
        ).resolves.toEqual({value: "created"});
    });

    test("uses a server error message when available", async () => {
        server.use(
            http.get(`${API_URL}/example`, () =>
                HttpResponse.json({message: "Access denied"}, {status: 403}),
            ),
        );

        await expect(apiRequest("/example", responseSchema)).rejects.toThrow("Access denied");
    });

    test("rejects an invalid successful response", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        server.use(http.get(`${API_URL}/example`, () => HttpResponse.json({value: 123})));

        await expect(apiRequest("/example", responseSchema)).rejects.toThrow(
            "Invalid server response",
        );
        expect(consoleError).toHaveBeenCalledWith("Invalid API response", expect.anything());
    });
});
