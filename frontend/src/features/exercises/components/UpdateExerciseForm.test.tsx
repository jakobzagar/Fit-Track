import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import type {Exercise} from "../exercise.types";
import {UpdateExerciseForm} from "./UpdateExerciseForm";

const exercise: Exercise = {
    id: "123e4567-e89b-42d3-a456-426614174001",
    userId: "123e4567-e89b-42d3-a456-426614174000",
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    isArchived: false,
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};

describe("UpdateExerciseForm", () => {
    test("starts with current values and submits normalized changes", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<UpdateExerciseForm exercise={exercise} onSubmit={onSubmit} onCancel={vi.fn()} />);

        expect(screen.getByLabelText("Name")).toHaveValue("Bench press");
        await user.clear(screen.getByLabelText("Name"));
        await user.type(screen.getByLabelText("Name"), "  Incline press  ");
        await user.clear(screen.getByLabelText("Equipment"));
        await user.click(screen.getByRole("button", {name: "Save changes"}));

        expect(onSubmit).toHaveBeenCalledWith({
            name: "Incline press",
            muscleGroup: "Chest",
            equipment: null,
        });
    });

    test("validates cleared required fields and supports cancellation", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onCancel = vi.fn();
        render(<UpdateExerciseForm exercise={exercise} onSubmit={onSubmit} onCancel={onCancel} />);

        await user.clear(screen.getByLabelText("Name"));
        await user.click(screen.getByRole("button", {name: "Save changes"}));
        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", {name: "Cancel"}));
        expect(onCancel).toHaveBeenCalledOnce();
    });
});
