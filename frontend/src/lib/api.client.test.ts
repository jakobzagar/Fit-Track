import {http, HttpResponse} from "msw";
import {z} from "zod";
import {describe, expect, test, vi} from "vitest";
import {API_URL} from "../test/constants";
import {server} from "../test/mocks/server";
import {ApiError} from "../common/errors/api.error";
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

        const request = apiRequest("/example", responseSchema);

        await expect(request).rejects.toMatchObject({
            name: "ApiError",
            message: "Access denied",
            status: 403,
        });
    });

    test("rejects an invalid successful response", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        server.use(http.get(`${API_URL}/example`, () => HttpResponse.json({value: 123})));

        await expect(apiRequest("/example", responseSchema)).rejects.toEqual(
            expect.objectContaining<ApiError>({
                name: "ApiError",
                message: "Invalid server response",
                status: 200,
            }),
        );
        expect(consoleError).toHaveBeenCalledWith("Invalid API response", expect.anything());
    });

    test.each([
        ["an empty response", "", undefined],
        ["an HTML response", "<html>Bad gateway</html>", "text/html"],
        ["malformed JSON", "{invalid", "application/json"],
    ])("handles %s from a failed request", async (_case, body, contentType) => {
        server.use(
            http.get(
                `${API_URL}/example`,
                () =>
                    new HttpResponse(body, {
                        status: 502,
                        headers: contentType ? {"Content-Type": contentType} : undefined,
                    }),
            ),
        );

        await expect(apiRequest("/example", responseSchema)).rejects.toMatchObject({
            name: "ApiError",
            message: "Request failed",
            status: 502,
        });
    });

    test.each([
        ["an empty response", "", undefined],
        ["an HTML response", "<html>Unexpected response</html>", "text/html"],
        ["malformed JSON", "{invalid", "application/json"],
    ])(
        "rejects %s from a successful request as an invalid contract",
        async (_case, body, contentType) => {
            const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
            server.use(
                http.get(
                    `${API_URL}/example`,
                    () =>
                        new HttpResponse(body, {
                            status: 200,
                            headers: contentType ? {"Content-Type": contentType} : undefined,
                        }),
                ),
            );

            await expect(apiRequest("/example", responseSchema)).rejects.toMatchObject({
                name: "ApiError",
                message: "Invalid server response",
                status: 200,
            });
            expect(consoleError).toHaveBeenCalled();
        },
    );
});
