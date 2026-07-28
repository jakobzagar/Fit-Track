import {http, HttpResponse} from "msw";
import {Route, Routes} from "react-router";
import {screen} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {LoginPage} from "./LogInPage";
import {RegisterPage} from "./RegisterPage";

const API_URL = "http://localhost:3001/api";
const userResponse = {
    user: {
        id: "123e4567-e89b-42d3-a456-426614174000",
        name: "Jakob",
        email: "jakob@example.com",
        createdAt: "2026-07-26T10:00:00.000Z",
        updatedAt: "2026-07-26T10:00:00.000Z",
    },
};

function renderAuthPage(path: "/login" | "/register") {
    return renderWithProviders(
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/workouts" element={<h1>Workouts</h1>} />
        </Routes>,
        {route: path},
    );
}

describe("LoginPage", () => {
    test("logs in with valid credentials and navigates to workouts", async () => {
        server.use(
            http.post(`${API_URL}/auth/login`, async ({request}) => {
                expect(await request.json()).toEqual({
                    email: "jakob@example.com",
                    password: "password123",
                });

                return HttpResponse.json(userResponse);
            }),
        );
        const {user} = renderAuthPage("/login");

        await user.type(screen.getByLabelText("Email"), "jakob@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", {name: "Log In"}));

        expect(await screen.findByRole("heading", {name: "Workouts"})).toBeInTheDocument();
    });

    test("shows the API error when credentials are rejected", async () => {
        server.use(
            http.post(`${API_URL}/auth/login`, () =>
                HttpResponse.json({message: "Invalid email or password"}, {status: 401}),
            ),
        );
        const {user} = renderAuthPage("/login");

        await user.type(screen.getByLabelText("Email"), "jakob@example.com");
        await user.type(screen.getByLabelText("Password"), "wrong-password");
        await user.click(screen.getByRole("button", {name: "Log In"}));

        expect(await screen.findByRole("status")).toHaveTextContent("Invalid email or password");
        expect(screen.getByRole("heading", {name: "Sign in"})).toBeInTheDocument();
    });
});

describe("RegisterPage", () => {
    test("registers valid data and navigates to workouts", async () => {
        server.use(
            http.post(`${API_URL}/auth/register`, async ({request}) => {
                expect(await request.json()).toEqual({
                    name: "Jakob",
                    email: "jakob@example.com",
                    password: "password123",
                });

                return HttpResponse.json(userResponse, {status: 201});
            }),
        );
        const {user} = renderAuthPage("/register");

        await user.type(screen.getByLabelText("Name"), "Jakob");
        await user.type(screen.getByLabelText("Email"), "jakob@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", {name: "Register"}));

        expect(await screen.findByRole("heading", {name: "Workouts"})).toBeInTheDocument();
    });

    test("shows the API error when the email already exists", async () => {
        server.use(
            http.post(`${API_URL}/auth/register`, () =>
                HttpResponse.json({message: "Email is already registered"}, {status: 409}),
            ),
        );
        const {user} = renderAuthPage("/register");

        await user.type(screen.getByLabelText("Name"), "Jakob");
        await user.type(screen.getByLabelText("Email"), "jakob@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", {name: "Register"}));

        expect(await screen.findByRole("status")).toHaveTextContent("Email is already registered");
        expect(screen.getByRole("heading", {name: "Create account"})).toBeInTheDocument();
    });
});
