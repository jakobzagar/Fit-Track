import {http, HttpResponse} from "msw";
import {Route, Routes} from "react-router";
import {screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {GuestRoute} from "./GuestRoute";

const API_URL = "http://localhost:3001/api";

function renderGuestRoute() {
    return renderWithProviders(
        <Routes>
            <Route element={<GuestRoute />}>
                <Route path="/login" element={<h1>Login</h1>} />
            </Route>
            <Route path="/workouts" element={<h1>Workouts</h1>} />
        </Routes>,
        {route: "/login"},
    );
}

describe("GuestRoute", () => {
    test("renders the guest page for a signed-out visitor", async () => {
        renderGuestRoute();
        expect(await screen.findByRole("heading", {name: "Login"})).toBeInTheDocument();
    });

    test("redirects an authenticated user to workouts", async () => {
        server.use(
            http.get(`${API_URL}/auth/me`, () =>
                HttpResponse.json({
                    user: {
                        id: "123e4567-e89b-42d3-a456-426614174000",
                        name: "Jakob",
                        email: "jakob@example.com",
                        createdAt: "2026-07-26T10:00:00.000Z",
                        updatedAt: "2026-07-26T10:00:00.000Z",
                    },
                }),
            ),
        );

        renderGuestRoute();
        expect(await screen.findByRole("heading", {name: "Workouts"})).toBeInTheDocument();
    });
});
