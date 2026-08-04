import {http, HttpResponse} from "msw";
import {createMemoryRouter, RouterProvider} from "react-router";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {AppProviders} from "../../../app/providers";
import {server} from "../../../test/mocks/server";
import {
    createWorkout,
    exercise,
    workoutExercise,
    workoutExerciseId,
    workoutId,
    workoutSet,
} from "../../../test/fixtures/workouts";
import {WorkoutSessionPage} from "./WorkoutSessionPage";

const API_URL = "http://localhost:3001/api";

function renderPage() {
    const router = createMemoryRouter(
        [
            {path: "/workouts/:workoutId/session", element: <WorkoutSessionPage />},
            {path: "/workouts/:workoutId", element: <h1>Workout detail</h1>},
            {path: "/workouts", element: <h1>Workouts</h1>},
        ],
        {initialEntries: [`/workouts/${workoutId}/session`]},
    );

    return {
        user: userEvent.setup(),
        router,
        ...render(
            <AppProviders>
                <RouterProvider router={router} />
            </AppProviders>,
        ),
    };
}

function useLoadHandlers(workout = createWorkout()) {
    server.use(
        http.get(`${API_URL}/workouts/${workoutId}`, () => HttpResponse.json({workout})),
        http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
        http.get(`${API_URL}/workouts/${workoutId}/previous-performances`, () =>
            HttpResponse.json({previousPerformances: []}),
        ),
    );
}

describe("WorkoutSessionPage", () => {
    test("starts a draft workout and renders the live session", async () => {
        const draft = createWorkout({status: "DRAFT", startedAt: null});
        useLoadHandlers(draft);
        const startRequest = vi.fn();
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/start`, () => {
                startRequest();
                return HttpResponse.json({
                    workout: {...draft, status: "ACTIVE", startedAt: "2026-07-26T10:05:00.000Z"},
                });
            }),
        );

        renderPage();

        expect(screen.getByText("Starting workout")).toBeInTheDocument();
        expect(await screen.findByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(startRequest).toHaveBeenCalledOnce();
        expect(screen.getByText("Workout in progress")).toBeInTheDocument();
    });

    test("redirects an already completed workout to its details", async () => {
        useLoadHandlers(createWorkout({status: "COMPLETED"}));
        renderPage();

        expect(await screen.findByRole("heading", {name: "Workout detail"})).toBeInTheDocument();
    });

    test("retries a failed session load", async () => {
        let attempts = 0;
        server.use(
            http.get(`${API_URL}/workouts/${workoutId}`, () => {
                attempts += 1;
                return attempts === 1
                    ? HttpResponse.json({message: "Session unavailable"}, {status: 503})
                    : HttpResponse.json({workout: createWorkout()});
            }),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
            http.get(`${API_URL}/workouts/${workoutId}/previous-performances`, () =>
                HttpResponse.json({previousPerformances: []}),
            ),
        );
        const {user} = renderPage();

        await user.click(await screen.findByRole("button", {name: "Try again"}));
        expect(await screen.findByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(attempts).toBe(2);
    });

    test("updates completion of a set", async () => {
        useLoadHandlers();
        server.use(
            http.patch(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSet.id}/completion`,
                async ({request}) => {
                    expect(await request.json()).toEqual({
                        reps: 8,
                        weight: 80,
                        durationSeconds: null,
                        completed: true,
                    });
                    return HttpResponse.json({
                        workoutExerciseSet: {
                            ...workoutSet,
                            completedAt: "2026-07-26T10:20:00.000Z",
                        },
                    });
                },
            ),
        );
        const {user} = renderPage();
        await screen.findByRole("heading", {name: "Push day"});

        await user.click(screen.getByRole("button", {name: "Complete"}));

        expect(await screen.findByRole("button", {name: "Undo set"})).toBeInTheDocument();
        expect(screen.getByText("1/1 done")).toBeInTheDocument();
        expect(screen.getByText("completed sets").parentElement).toHaveTextContent(
            /1\s*completed sets/,
        );
    });

    test("finishes a workout with completed sets and returns to detail", async () => {
        const completedSet = {...workoutSet, completedAt: "2026-07-26T10:20:00.000Z"};
        const active = createWorkout({
            workoutExercises: [{...createWorkout().workoutExercises[0], sets: [completedSet]}],
        });
        useLoadHandlers(active);
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/finish`, () =>
                HttpResponse.json({
                    workout: {
                        ...active,
                        status: "COMPLETED",
                        completedAt: "2026-07-26T10:30:00.000Z",
                    },
                }),
            ),
        );
        const {user} = renderPage();
        await screen.findByRole("heading", {name: "Push day"});

        await user.click(screen.getByRole("button", {name: "Finish workout"}));

        expect(await screen.findByRole("heading", {name: "Workout detail"})).toBeInTheDocument();
    });

    test("shows a finish error and keeps the active session open", async () => {
        const completedSet = {...workoutSet, completedAt: "2026-07-26T10:20:00.000Z"};
        useLoadHandlers(
            createWorkout({
                workoutExercises: [{...createWorkout().workoutExercises[0], sets: [completedSet]}],
            }),
        );
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/finish`, () =>
                HttpResponse.json({message: "Workout could not be finished"}, {status: 409}),
            ),
        );
        const {user} = renderPage();
        await screen.findByRole("heading", {name: "Push day"});
        await user.click(screen.getByRole("button", {name: "Finish workout"}));

        expect(await screen.findByRole("alert")).toHaveTextContent("Workout could not be finished");
        expect(screen.getByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Finish workout"})).toBeEnabled();
    });

    test("copies the last set", async () => {
        useLoadHandlers();
        const copiedSet = {
            ...workoutSet,
            id: "123e4567-e89b-42d3-a456-426614174088",
            setNumber: 2,
        };
        server.use(
            http.post(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
                async ({request}) => {
                    expect(await request.json()).toEqual({reps: 8, weight: 80});
                    return HttpResponse.json({workoutExerciseSet: copiedSet}, {status: 201});
                },
            ),
        );
        const {user} = renderPage();
        await screen.findByRole("heading", {name: "Push day"});
        await user.click(screen.getByRole("button", {name: "Copy last set"}));

        expect(await screen.findByText("0/2 done")).toBeInTheDocument();
    });

    test("adds an exercise to an active session", async () => {
        useLoadHandlers(createWorkout({workoutExercises: []}));
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/exercises`, () => {
                const {sets: _sets, ...created} = workoutExercise;
                return HttpResponse.json({workoutExercise: created}, {status: 201});
            }),
        );
        const {user} = renderPage();
        await screen.findByText("This session needs a movement.");
        await user.selectOptions(screen.getByLabelText("Exercise"), exercise.id);
        await user.click(screen.getByRole("button", {name: "Add exercise"}));

        expect(await screen.findByRole("heading", {name: "Bench press"})).toBeInTheDocument();
    });

    test("blocks finishing while a set has unsaved edits", async () => {
        const completedSet = {...workoutSet, completedAt: "2026-07-26T10:20:00.000Z"};
        const editableSet = {
            ...workoutSet,
            id: "123e4567-e89b-42d3-a456-426614174031",
            setNumber: 2,
        };
        const active = createWorkout({
            workoutExercises: [
                {...createWorkout().workoutExercises[0], sets: [completedSet, editableSet]},
            ],
        });
        useLoadHandlers(active);
        const finishRequest = vi.fn();
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/finish`, () => {
                finishRequest();
                return HttpResponse.json({workout: active});
            }),
        );
        const {user} = renderPage();
        await screen.findByRole("heading", {name: "Push day"});

        const repsInputs = screen.getAllByLabelText("Reps");
        await user.clear(repsInputs[1]);
        await user.type(repsInputs[1], "10");
        await user.click(screen.getByRole("button", {name: "Finish workout"}));

        expect(screen.getByRole("alert")).toHaveTextContent(
            "Save or complete the edited set before finishing the workout.",
        );
        expect(finishRequest).not.toHaveBeenCalled();
    });

    test("blocks every in-app navigation while a set has unsaved edits", async () => {
        useLoadHandlers();
        const {user, router} = renderPage();
        await screen.findByRole("heading", {name: "Push day"});

        const repsInput = screen.getAllByLabelText("Reps")[0];
        await user.clear(repsInput);
        await user.type(repsInput, "10");
        void router.navigate("/workouts");

        expect(
            await screen.findByRole("alertdialog", {name: "Discard unsaved set changes?"}),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: "Push day"})).toBeInTheDocument();

        await user.click(screen.getByRole("button", {name: "Cancel"}));
        expect(screen.getByRole("heading", {name: "Push day"})).toBeInTheDocument();

        void router.navigate("/workouts");
        await user.click(await screen.findByRole("button", {name: "Discard and leave"}));
        expect(await screen.findByRole("heading", {name: "Workouts"})).toBeInTheDocument();
    });
});
