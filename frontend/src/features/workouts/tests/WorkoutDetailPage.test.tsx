import {http, HttpResponse} from "msw";
import {Route, Routes} from "react-router";
import {screen, within} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
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
import {WorkoutDetailPage} from "../pages/WorkoutDetailPage";

function renderPage() {
    return renderWithProviders(
        <Routes>
            <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
            <Route path="/workouts/:workoutId/session" element={<h1>Workout session</h1>} />
        </Routes>,
        {route: `/workouts/${workoutId}`},
    );
}

function mockLoadRequests(workout = createWorkout(), exercises = [exercise]) {
    server.use(
        http.get(`${API_URL}/workouts/${workoutId}`, () => HttpResponse.json({workout})),
        http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises})),
    );
}

describe("WorkoutDetailPage", () => {
    test("loads workout details and its logged sets", async () => {
        mockLoadRequests();
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

    test("renders a completed workout as read-only", async () => {
        mockLoadRequests(
            createWorkout({
                status: "COMPLETED",
                completedAt: "2026-07-26T11:00:00.000Z",
            }),
        );
        renderPage();

        expect(await screen.findByText("Completed session")).toBeInTheDocument();
        expect(screen.queryByRole("heading", {name: "Add exercise"})).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Edit"})).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Edit set"})).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Delete"})).not.toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "Add set"})).not.toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Reopen workout"})).toBeInTheDocument();
    });

    test("reopens a completed workout after confirmation", async () => {
        const completed = createWorkout({
            status: "COMPLETED",
            completedAt: "2026-07-26T11:00:00.000Z",
        });
        mockLoadRequests(completed);
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/reopen`, () =>
                HttpResponse.json({
                    workout: {
                        id: completed.id,
                        name: completed.name,
                        status: "ACTIVE",
                        startedAt: completed.startedAt,
                        completedAt: null,
                        performedAt: completed.performedAt,
                        notes: completed.notes,
                        createdAt: completed.createdAt,
                        updatedAt: completed.updatedAt,
                        userId: completed.userId,
                    },
                }),
            ),
        );
        const {user} = renderPage();
        await screen.findByText("Completed session");

        await user.click(screen.getByRole("button", {name: "Reopen workout"}));
        const dialog = screen.getByRole("alertdialog", {name: "Reopen completed workout?"});
        await user.click(within(dialog).getByRole("button", {name: "Reopen workout"}));

        expect(await screen.findByRole("heading", {name: "Workout session"})).toBeInTheDocument();
    });

    test("shows a failed load", async () => {
        server.use(
            http.get(`${API_URL}/workouts/${workoutId}`, () =>
                HttpResponse.json({message: "Workout not found"}, {status: 404}),
            ),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: []})),
        );
        renderPage();

        expect(await screen.findByRole("alert")).toHaveTextContent("Workout not found");
    });

    test("retries a failed load", async () => {
        let attempts = 0;
        server.use(
            http.get(`${API_URL}/workouts/${workoutId}`, () => {
                attempts += 1;
                return attempts === 1
                    ? HttpResponse.json({message: "Temporary failure"}, {status: 503})
                    : HttpResponse.json({workout: createWorkout()});
            }),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
        );
        const {user} = renderPage();

        await user.click(await screen.findByRole("button", {name: "Try again"}));
        expect(await screen.findByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(attempts).toBe(2);
    });

    test("adds an available exercise", async () => {
        mockLoadRequests(createWorkout({workoutExercises: []}));
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
        mockLoadRequests(createWorkout({workoutExercises: [exerciseWithoutSets]}));
        server.use(
            http.post(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
                async ({request}) => {
                    expect(await request.json()).toEqual({reps: 8, weight: 80});
                    return HttpResponse.json({workoutSet: workoutSet}, {status: 201});
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

    test("updates and removes a workout exercise", async () => {
        mockLoadRequests();
        server.use(
            http.patch(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}`,
                async ({request}) => {
                    expect(await request.json()).toMatchObject({position: 1, notes: "Paused reps"});
                    return HttpResponse.json({
                        workoutExercise: {...workoutExercise, notes: "Paused reps"},
                    });
                },
            ),
            http.delete(`${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}`, () =>
                HttpResponse.json({message: "Exercise removed"}),
            ),
        );
        const {user} = renderPage();
        await screen.findByRole("heading", {name: "Bench press"});

        await user.click(screen.getByRole("button", {name: "Edit"}));
        await user.clear(screen.getByLabelText("Notes"));
        await user.type(screen.getByLabelText("Notes"), "Paused reps");
        await user.click(screen.getByRole("button", {name: "Save exercise"}));
        expect(await screen.findByText("Paused reps")).toBeInTheDocument();

        const exerciseCard = screen.getByRole("heading", {name: "Bench press"}).closest("article");
        if (!exerciseCard) throw new Error("Exercise card is missing");
        await user.click(within(exerciseCard).getAllByRole("button", {name: "Delete"})[0]);
        await user.click(
            within(screen.getByRole("alertdialog")).getByRole("button", {
                name: "Remove exercise",
            }),
        );
        expect(await screen.findByText("No exercises added yet.")).toBeInTheDocument();
    });

    test("shows an add-exercise mutation error", async () => {
        mockLoadRequests(createWorkout({workoutExercises: []}));
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/exercises`, () =>
                HttpResponse.json({message: "Exercise already added"}, {status: 409}),
            ),
        );
        const {user} = renderPage();
        await screen.findByText("No exercises added yet.");
        await user.selectOptions(screen.getByLabelText("Exercise"), exerciseId);
        await user.click(screen.getByRole("button", {name: "Add exercise"}));

        expect(await screen.findByRole("alert")).toHaveTextContent("Exercise already added");
    });

    test("updates an existing workout set", async () => {
        mockLoadRequests();
        server.use(
            http.patch(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSet.id}`,
                async ({request}) => {
                    expect(await request.json()).toMatchObject({reps: 10, weight: 80});
                    return HttpResponse.json({
                        workoutSet: {...workoutSet, reps: 10},
                    });
                },
            ),
        );
        const {user} = renderPage();
        const editButton = await screen.findByRole("button", {name: "Edit set"});
        const setItem = editButton.closest("li");
        if (!setItem) throw new Error("Set row is missing");
        await user.click(editButton);
        const repsInput = within(setItem).getByLabelText("Reps");
        await user.clear(repsInput);
        await user.type(repsInput, "10");
        await user.click(within(setItem).getByRole("button", {name: "Save set"}));

        expect(await within(setItem).findByText("10")).toBeInTheDocument();
    });
});
