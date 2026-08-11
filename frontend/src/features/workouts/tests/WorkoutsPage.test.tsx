import {http, HttpResponse} from "msw";
import {screen, within} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {server} from "../../../test/mocks/server";
import {renderWithProviders} from "../../../test/render";
import {createWorkoutSummary} from "../../../test/fixtures/workouts";
import {WorkoutsPage} from "../pages/WorkoutsPage";
import type {WorkoutSummary} from "../workout.types";

const summary = createWorkoutSummary({status: "DRAFT"});
const {_count: _count, ...workout} = summary;

function handleWorkoutList(workouts: WorkoutSummary[] = [summary]) {
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

    test("shows the correct primary action for active and completed workouts", async () => {
        server.use(
            handleWorkoutList([
                {...summary, status: "ACTIVE"},
                {...summary, id: "123e4567-e89b-42d3-a456-426614174099", status: "COMPLETED"},
            ]),
        );
        renderWithProviders(<WorkoutsPage />);

        expect(await screen.findByRole("link", {name: /Continue workout/})).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "View workout"})).toBeInTheDocument();
        expect(screen.getAllByRole("button", {name: "Edit"})).toHaveLength(1);
        expect(screen.getAllByRole("button", {name: "Delete"})).toHaveLength(1);
    });

    test("shows the empty state", async () => {
        server.use(handleWorkoutList([]));
        renderWithProviders(<WorkoutsPage />);

        expect(await screen.findByText("No sessions logged yet.")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Create your first workout"})).toBeInTheDocument();
    });

    test("shows a load error", async () => {
        server.use(
            http.get(`${API_URL}/workouts`, () =>
                HttpResponse.json({message: "Could not load workouts"}, {status: 500}),
            ),
        );
        renderWithProviders(<WorkoutsPage />);
        expect(await screen.findByRole("alert")).toHaveTextContent("Could not load workouts");
        expect(screen.getByRole("button", {name: "Try again"})).toBeInTheDocument();
    });

    test("retries the initial load without a page refresh", async () => {
        let attempts = 0;
        server.use(
            http.get(`${API_URL}/workouts`, () => {
                attempts += 1;
                return attempts === 1
                    ? HttpResponse.json({message: "Could not load workouts"}, {status: 500})
                    : HttpResponse.json({workouts: [summary]});
            }),
        );
        const {user} = renderWithProviders(<WorkoutsPage />);

        await user.click(await screen.findByRole("button", {name: "Try again"}));
        expect(await screen.findByRole("heading", {name: "Push day"})).toBeInTheDocument();
        expect(attempts).toBe(2);
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

        await user.click(screen.getByRole("button", {name: "Create workout"}));
        const dialog = screen.getByRole("dialog", {name: "Create workout"});
        expect(dialog).toBeInTheDocument();
        await user.type(screen.getByLabelText("Name"), "Push day");
        await user.click(within(dialog).getByRole("button", {name: "Create workout"}));

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

    test("keeps a workout when deletion is cancelled", async () => {
        server.use(handleWorkoutList());
        const {user} = renderWithProviders(<WorkoutsPage />);
        await screen.findByRole("heading", {name: "Push day"});

        await user.click(screen.getByRole("button", {name: "Delete"}));
        await user.click(screen.getByRole("button", {name: "Cancel"}));

        expect(screen.getByRole("heading", {name: "Push day"})).toBeInTheDocument();
    });

    test("shows a mutation error and keeps the create dialog open", async () => {
        server.use(
            handleWorkoutList([]),
            http.post(`${API_URL}/workouts`, () =>
                HttpResponse.json({message: "Workout already exists"}, {status: 409}),
            ),
        );
        const {user} = renderWithProviders(<WorkoutsPage />);
        await screen.findByText("No sessions logged yet.");
        await user.click(screen.getByRole("button", {name: "Create workout"}));
        const dialog = screen.getByRole("dialog", {name: "Create workout"});
        await user.type(screen.getByLabelText("Name"), "Push day");
        await user.click(within(dialog).getByRole("button", {name: "Create workout"}));

        expect(await screen.findByRole("alert")).toHaveTextContent("Workout already exists");
        expect(screen.getByRole("dialog", {name: "Create workout"})).toBeInTheDocument();
    });
});
