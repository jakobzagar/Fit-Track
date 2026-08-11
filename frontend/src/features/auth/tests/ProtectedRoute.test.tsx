import {http, HttpResponse} from "msw";
import {Route, Routes} from "react-router";
import {screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {user} from "../../../test/fixtures/users";
import {ProtectedRoute} from "../components/ProtectedRoute";

function renderProtectedRoute() {
    return renderWithProviders(
        <Routes>
            <Route path="/login" element={<h1>Login</h1>} />
            <Route element={<ProtectedRoute />}>
                <Route path="/workouts" element={<h1>Private workouts</h1>} />
            </Route>
        </Routes>,
        {route: "/workouts"},
    );
}

describe("ProtectedRoute", () => {
    test("shows a loading state while the session is being checked", () => {
        server.use(
            http.get(`${API_URL}/auth/me`, async () => {
                await new Promise(() => undefined);
                return HttpResponse.json({});
            }),
        );

        renderProtectedRoute();

        expect(screen.getByText("Checking session")).toBeInTheDocument();
    });

    test("redirects a signed-out visitor to login", async () => {
        renderProtectedRoute();

        expect(await screen.findByRole("heading", {name: "Login"})).toBeInTheDocument();
    });

    test("renders the protected page for an authenticated user", async () => {
        server.use(http.get(`${API_URL}/auth/me`, () => HttpResponse.json({user})));

        renderProtectedRoute();

        expect(await screen.findByRole("heading", {name: "Private workouts"})).toBeInTheDocument();
    });
});
