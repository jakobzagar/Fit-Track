import {http, HttpResponse} from "msw";
import {describe, expect, test, vi} from "vitest";
import {onSessionExpired} from "../../../lib/auth/session-expiration";
import {API_URL} from "../../../test/constants";
import {server} from "../../../test/mocks/server";
import {login} from "../api/auth.api";

describe("auth API", () => {
    test("does not expire an existing session when login credentials are rejected", async () => {
        const listener = vi.fn();
        const unsubscribe = onSessionExpired(listener);
        server.use(
            http.post(`${API_URL}/auth/login`, () =>
                HttpResponse.json({message: "Invalid email or password"}, {status: 401}),
            ),
        );

        await expect(
            login({email: "jakob@example.com", password: "incorrect-password"}),
        ).rejects.toMatchObject({status: 401});

        unsubscribe();
        expect(listener).not.toHaveBeenCalled();
    });
});
