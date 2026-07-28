import {http, HttpResponse} from "msw";
import {Route, Routes} from "react-router";
import {screen, within} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {renderWithProviders} from "../../../test/render";
import {server} from "../../../test/mocks/server";
import {
    createWorkout,
    exercise,
    exerciseId,
    workoutExercise,
    workoutExerciseId,
    workoutId,
    workoutSet,
} from "../../../test/fixtures/workouts";
import {WorkoutDetailPage} from "./WorkoutDetailPage";

const API_URL = "http://localhost:3001/api";

function renderPage() {
    return renderWithProviders(
        <Routes>
            <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
        </Routes>,
        {route: `/workouts/${workoutId}`},
    );
}

function useLoadHandlers(workout = createWorkout(), exercises = [exercise]) {
    server.use(
        http.get(`${API_URL}/workouts/${workoutId}`, () => HttpResponse.json({workout})),
        http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises})),
    );
}

describe("WorkoutDetailPage", () => {
    test("loads workout details and its logged sets", async () => {
        useLoadHandlers();
        renderPage();

        expect(screen.getByText("Loading workout")).toBeInTheDocument();
        expect(await screen.findByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(screen.getByRole("heading", {name: "Bench press"})).toBeInTheDocument();
        expect(screen.getByText("80")).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Continue session"})).toHaveAttribute(
            "href",
            `/workouts/${workoutId}/session`,
        );
    });

    test("shows a failed load", async () => {
        server.use(
            http.get(`${API_URL}/workouts/${workoutId}`, () =>
                HttpResponse.json({message: "Workout not found"}, {status: 404}),
            ),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: []})),
        );
        renderPage();

        expect(await screen.findByRole("status")).toHaveTextContent("Workout not found");
    });

    test("adds an available exercise", async () => {
        useLoadHandlers(createWorkout({workoutExercises: []}));
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/exercises`, async ({request}) => {
                expect(await request.json()).toEqual({exerciseId});
                const {sets: _sets, ...createdExercise} = workoutExercise;
                return HttpResponse.json({workoutExercise: createdExercise}, {status: 201});
            }),
        );
        const {user} = renderPage();
        await screen.findByText("No exercises added yet.");

        await user.selectOptions(screen.getByLabelText("Exercise"), exerciseId);
        await user.click(screen.getByRole("button", {name: "Add exercise"}));

        expect(await screen.findByRole("heading", {name: "Bench press"})).toBeInTheDocument();
        expect(screen.getByText("No sets added yet")).toBeInTheDocument();
    });

    test("adds and deletes a workout set", async () => {
        const exerciseWithoutSets = {...workoutExercise, sets: []};
        useLoadHandlers(createWorkout({workoutExercises: [exerciseWithoutSets]}));
        server.use(
            http.post(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
                async ({request}) => {
                    expect(await request.json()).toEqual({reps: 8, weight: 80});
                    return HttpResponse.json({workoutExerciseSet: workoutSet}, {status: 201});
                },
            ),
            http.delete(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSet.id}`,
                () => HttpResponse.json({message: "Set deleted"}),
            ),
        );
        const {user} = renderPage();
        await screen.findByText("No sets added yet");

        await user.type(screen.getByLabelText("Reps"), "8");
        await user.type(screen.getByLabelText("Weight"), "80");
        await user.click(screen.getByRole("button", {name: "Add set"}));
        await screen.findByText("Logged sets");

        const setItem = screen.getByRole("button", {name: "Edit set"}).closest("li");
        if (!setItem) throw new Error("Set row is missing");
        await user.click(within(setItem).getByRole("button", {name: "Delete"}));
        const dialog = screen.getByRole("alertdialog", {name: "Delete set?"});
        await user.click(within(dialog).getByRole("button", {name: "Delete set"}));

        expect(await screen.findByText("No sets added yet")).toBeInTheDocument();
    });
});
