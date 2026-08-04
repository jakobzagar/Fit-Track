import axe from "axe-core";
import {render, screen} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {createMemoryRouter, RouterProvider} from "react-router";
import {describe, expect, test} from "vitest";
import {AppProviders} from "../app/providers";
import {LandingPage} from "../features/landing/pages/LandingPage";
import {LoginPage} from "../features/auth/pages/LogInPage";
import {RegisterPage} from "../features/auth/pages/RegisterPage";
import {WorkoutsPage} from "../features/workouts/pages/WorkoutsPage";
import {ExercisesPage} from "../features/exercises/pages/ExercisesPage";
import {WorkoutDetailPage} from "../features/workouts/pages/WorkoutDetailPage";
import {WorkoutSessionPage} from "../features/workouts/pages/WorkoutSessionPage";
import {API_URL} from "./constants";
import {server} from "./mocks/server";
import {createWorkout, exercise, workoutId} from "./fixtures/workouts";
import {renderWithProviders} from "./render";

async function expectNoAccessibilityViolations(container: HTMLElement) {
    const result = await axe.run(container, {
        rules: {"color-contrast": {enabled: false}},
    });
    expect(
        result.violations.map((violation) => ({
            id: violation.id,
            targets: violation.nodes.map((node) => node.target),
        })),
    ).toEqual([]);
}

describe("accessibility smoke tests", () => {
    test.each([
        ["landing", <LandingPage />, "Train with"],
        ["login", <LoginPage />, "Sign in"],
        ["register", <RegisterPage />, "Create account"],
    ])("has no detectable violations on the %s page", async (_name, page, heading) => {
        const {container} = renderWithProviders(page);
        await screen.findByRole("heading", {name: new RegExp(heading, "i")});
        await expectNoAccessibilityViolations(container);
    });

    test.each([
        ["workouts", <WorkoutsPage />, "Workouts"],
        ["exercises", <ExercisesPage />, "Movements"],
    ])("has no detectable violations on the %s page", async (_name, page, heading) => {
        server.use(
            http.get(`${API_URL}/workouts`, () => HttpResponse.json({workouts: []})),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: []})),
        );
        const {container} = render(
            <AppProviders>
                <main>{page}</main>
            </AppProviders>,
        );
        await screen.findByRole("heading", {name: heading});
        await expectNoAccessibilityViolations(container);
    });

    test("has no detectable violations on workout detail", async () => {
        server.use(
            http.get(`${API_URL}/workouts/${workoutId}`, () =>
                HttpResponse.json({workout: createWorkout()}),
            ),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
        );
        const router = createMemoryRouter(
            [{path: "/workouts/:workoutId", element: <WorkoutDetailPage />}],
            {initialEntries: [`/workouts/${workoutId}`]},
        );
        const {container} = render(
            <AppProviders>
                <main>
                    <RouterProvider router={router} />
                </main>
            </AppProviders>,
        );
        await screen.findByRole("heading", {name: "Push day"});
        await expectNoAccessibilityViolations(container);
    });

    test("has no detectable violations during an active workout", async () => {
        server.use(
            http.get(`${API_URL}/workouts/${workoutId}`, () =>
                HttpResponse.json({workout: createWorkout()}),
            ),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
            http.get(`${API_URL}/workouts/${workoutId}/previous-performances`, () =>
                HttpResponse.json({previousPerformances: []}),
            ),
        );
        const router = createMemoryRouter(
            [{path: "/workouts/:workoutId/session", element: <WorkoutSessionPage />}],
            {initialEntries: [`/workouts/${workoutId}/session`]},
        );
        const {container} = render(
            <AppProviders>
                <main>
                    <RouterProvider router={router} />
                </main>
            </AppProviders>,
        );
        await screen.findByRole("heading", {name: "Push day"});
        await expectNoAccessibilityViolations(container);
    });

    test("has no detectable violations in form and confirmation dialogs", async () => {
        const workout = {...createWorkout(), _count: {workoutExercises: 1}};
        server.use(http.get(`${API_URL}/workouts`, () => HttpResponse.json({workouts: [workout]})));
        const {container, user} = renderWithProviders(
            <main>
                <WorkoutsPage />
            </main>,
        );
        await screen.findByRole("heading", {name: "Push day"});

        await user.click(screen.getByRole("button", {name: "Edit"}));
        await screen.findByRole("dialog", {name: "Edit workout"});
        await expectNoAccessibilityViolations(container);
        await user.click(screen.getByRole("button", {name: "Close dialog"}));

        await user.click(screen.getByRole("button", {name: "Delete"}));
        await screen.findByRole("alertdialog", {name: "Delete workout?"});
        await expectNoAccessibilityViolations(container);
    });
});
