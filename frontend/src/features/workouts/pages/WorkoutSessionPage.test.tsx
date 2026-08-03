import {http, HttpResponse} from "msw";
import {Route, Routes} from "react-router";
import {screen} from "@testing-library/react";
import {describe, expect, test, vi} from "vitest";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {
    createWorkout,
    exercise,
    workoutExerciseId,
    workoutId,
    workoutSet,
} from "../../../test/fixtures/workouts";
import {WorkoutSessionPage} from "./WorkoutSessionPage";

const API_URL = "http://localhost:3001/api";

function renderPage() {
    return renderWithProviders(
        <Routes>
            <Route path="/workouts/:workoutId/session" element={<WorkoutSessionPage />} />
            <Route path="/workouts/:workoutId" element={<h1>Workout detail</h1>} />
        </Routes>,
        {route: `/workouts/${workoutId}/session`},
    );
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
});
