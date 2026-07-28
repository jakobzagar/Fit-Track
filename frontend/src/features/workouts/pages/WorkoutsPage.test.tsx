import {http, HttpResponse} from "msw";
import {screen, within} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {server} from "../../../test/mocks/server";
import {renderWithProviders} from "../../../test/render";
import {WorkoutsPage} from "./WorkoutsPage";

const API_URL = "http://localhost:3001/api";
const workout = {
    id: "123e4567-e89b-42d3-a456-426614174010",
    userId: "123e4567-e89b-42d3-a456-426614174000",
    name: "Push day",
    status: "DRAFT" as const,
    performedAt: "2026-07-26T10:00:00.000Z",
    startedAt: null,
    completedAt: null,
    notes: "Heavy session",
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};
const summary = {...workout, _count: {workoutExercises: 1}};

function handleWorkoutList(workouts = [summary]) {
    return http.get(`${API_URL}/workouts`, () => HttpResponse.json({workouts}));
}

describe("WorkoutsPage", () => {
    test("loads workouts and links to a draft session", async () => {
        server.use(handleWorkoutList());
        renderWithProviders(<WorkoutsPage />);

        expect(screen.getByLabelText("Loading content")).toBeInTheDocument();
        expect(await screen.findByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: /Start workout/})).toHaveAttribute(
            "href",
            `/workouts/${workout.id}/session`,
        );
    });

    test("shows empty and load-error states", async () => {
        server.use(handleWorkoutList([]));
        const {unmount} = renderWithProviders(<WorkoutsPage />);
        expect(await screen.findByText("No sessions logged yet.")).toBeInTheDocument();
        unmount();

        server.use(
            http.get(`${API_URL}/workouts`, () =>
                HttpResponse.json({message: "Could not load workouts"}, {status: 500}),
            ),
        );
        renderWithProviders(<WorkoutsPage />);
        expect(await screen.findByRole("status")).toHaveTextContent("Could not load workouts");
    });

    test("creates and prepends a workout", async () => {
        server.use(
            handleWorkoutList([]),
            http.post(`${API_URL}/workouts`, async ({request}) => {
                expect(await request.json()).toEqual({name: "Push day"});
                return HttpResponse.json({workout}, {status: 201});
            }),
        );
        const {user} = renderWithProviders(<WorkoutsPage />);
        await screen.findByText("No sessions logged yet.");

        await user.type(screen.getByLabelText("Name"), "Push day");
        await user.click(screen.getByRole("button", {name: "Create workout"}));

        expect(await screen.findByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Workout created successfully.");
    });

    test("edits a workout", async () => {
        const updated = {...workout, name: "Upper body"};
        server.use(
            handleWorkoutList(),
            http.patch(`${API_URL}/workouts/${workout.id}`, async ({request}) => {
                expect(await request.json()).toMatchObject({name: "Upper body"});
                return HttpResponse.json({workout: updated});
            }),
        );
        const {user} = renderWithProviders(<WorkoutsPage />);
        await screen.findByRole("heading", {name: "Push day"});

        await user.click(screen.getByRole("button", {name: "Edit"}));
        await user.clear(screen.getByLabelText("Name"));
        await user.type(screen.getByLabelText("Name"), "Upper body");
        await user.click(screen.getByRole("button", {name: "Save changes"}));

        expect(await screen.findByRole("heading", {name: "Upper body"})).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Workout updated successfully.");
    });

    test("deletes a workout only after confirmation", async () => {
        server.use(
            handleWorkoutList(),
            http.delete(`${API_URL}/workouts/${workout.id}`, () =>
                HttpResponse.json({message: "Workout deleted"}),
            ),
        );
        const {user} = renderWithProviders(<WorkoutsPage />);
        await screen.findByRole("heading", {name: "Push day"});

        await user.click(screen.getByRole("button", {name: "Delete"}));
        const dialog = screen.getByRole("alertdialog", {name: "Delete workout?"});
        expect(dialog).toHaveTextContent("Push day");
        await user.click(within(dialog).getByRole("button", {name: "Delete workout"}));

        expect(await screen.findByText("No sessions logged yet.")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Workout deleted.");
    });
});
