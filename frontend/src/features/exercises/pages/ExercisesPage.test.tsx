import {http, HttpResponse} from "msw";
import {screen, within} from "@testing-library/react";
import {describe, expect, test} from "vitest";
import {server} from "../../../test/mocks/server";
import {renderWithProviders} from "../../../test/render";
import {ExercisesPage} from "./ExercisesPage";

const API_URL = "http://localhost:3001/api";
const exercise = {
    id: "123e4567-e89b-42d3-a456-426614174001",
    userId: "123e4567-e89b-42d3-a456-426614174000",
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    isArchived: false,
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};

function handleExerciseList(exercises = [exercise]) {
    return http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises}));
}

describe("ExercisesPage", () => {
    test("loads and displays active exercises", async () => {
        server.use(handleExerciseList());
        renderWithProviders(<ExercisesPage />);

        expect(screen.getByLabelText("Loading content")).toBeInTheDocument();
        expect(await screen.findByRole("heading", {name: "Bench press"})).toBeInTheDocument();
        expect(screen.getByText("Chest")).toBeInTheDocument();
        expect(screen.getByText("Barbell")).toBeInTheDocument();
    });

    test("shows empty and load-error states", async () => {
        server.use(handleExerciseList([]));
        const {unmount} = renderWithProviders(<ExercisesPage />);
        expect(await screen.findByText("Your library is empty.")).toBeInTheDocument();
        unmount();

        server.use(
            http.get(`${API_URL}/exercises`, () =>
                HttpResponse.json({message: "Could not load exercises"}, {status: 500}),
            ),
        );
        renderWithProviders(<ExercisesPage />);
        expect(await screen.findByRole("status")).toHaveTextContent("Could not load exercises");
    });

    test("creates an exercise and appends it to the library", async () => {
        server.use(
            handleExerciseList([]),
            http.post(`${API_URL}/exercises`, async ({request}) => {
                expect(await request.json()).toEqual({
                    name: "Bench press",
                    muscleGroup: "Chest",
                    equipment: "Barbell",
                });
                return HttpResponse.json({exercise}, {status: 201});
            }),
        );
        const {user} = renderWithProviders(<ExercisesPage />);
        await screen.findByText("Your library is empty.");

        await user.type(screen.getByLabelText("Name"), "Bench press");
        await user.type(screen.getByLabelText("Muscle group"), "Chest");
        await user.type(screen.getByLabelText("Equipment"), "Barbell");
        await user.click(screen.getByRole("button", {name: "Create exercise"}));

        expect(await screen.findByRole("heading", {name: "Bench press"})).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Exercise created successfully.");
    });

    test("edits an existing exercise", async () => {
        const updatedExercise = {...exercise, name: "Incline press"};
        server.use(
            handleExerciseList(),
            http.patch(`${API_URL}/exercises/${exercise.id}`, async ({request}) => {
                expect(await request.json()).toMatchObject({name: "Incline press"});
                return HttpResponse.json({exercise: updatedExercise});
            }),
        );
        const {user} = renderWithProviders(<ExercisesPage />);
        await screen.findByRole("heading", {name: "Bench press"});

        await user.click(screen.getByRole("button", {name: "Edit"}));
        await user.clear(screen.getByLabelText("Name"));
        await user.type(screen.getByLabelText("Name"), "Incline press");
        await user.click(screen.getByRole("button", {name: "Save changes"}));

        expect(await screen.findByRole("heading", {name: "Incline press"})).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Exercise updated successfully.");
    });

    test("archives an exercise after confirmation", async () => {
        server.use(
            handleExerciseList(),
            http.delete(`${API_URL}/exercises/${exercise.id}`, () =>
                HttpResponse.json({exercise: {...exercise, isArchived: true}}),
            ),
        );
        const {user} = renderWithProviders(<ExercisesPage />);
        await screen.findByRole("heading", {name: "Bench press"});

        await user.click(screen.getByRole("button", {name: "Archive"}));
        const dialog = screen.getByRole("alertdialog", {name: "Archive exercise?"});
        expect(dialog).toHaveTextContent("Bench press");
        await user.click(within(dialog).getByRole("button", {name: "Archive"}));

        expect(await screen.findByText("Your library is empty.")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent("Exercise archived.");
    });

    test("loads archived exercises and restores one after confirmation", async () => {
        const archivedExercise = {...exercise, isArchived: true};
        server.use(
            http.get(`${API_URL}/exercises`, ({request}) => {
                const status = new URL(request.url).searchParams.get("status");
                return HttpResponse.json({
                    exercises: status === "archived" ? [archivedExercise] : [],
                });
            }),
            http.patch(`${API_URL}/exercises/${exercise.id}/restore`, () =>
                HttpResponse.json({exercise}),
            ),
        );
        const {user} = renderWithProviders(<ExercisesPage />);
        await screen.findByText("Your library is empty.");

        await user.click(screen.getByRole("tab", {name: "Archived"}));
        await screen.findByRole("heading", {name: "Bench press"});
        await user.click(screen.getByRole("button", {name: "Restore"}));
        await user.click(
            within(screen.getByRole("alertdialog")).getByRole("button", {name: "Restore"}),
        );

        expect(await screen.findByText("No archived exercises.")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent(
            "Exercise restored to your active library.",
        );
    });
});
