import {http, HttpResponse} from "msw";
import {Route, Routes} from "react-router";
import {screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {user} from "../../../test/fixtures/users";
import {GuestRoute} from "../components/GuestRoute";

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
        server.use(http.get(`${API_URL}/auth/me`, () => HttpResponse.json({user})));

        renderGuestRoute();
        expect(await screen.findByRole("heading", {name: "Workouts"})).toBeInTheDocument();
    });
});
