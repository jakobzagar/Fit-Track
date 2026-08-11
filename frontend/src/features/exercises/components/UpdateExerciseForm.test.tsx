import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {exercise} from "../../../test/fixtures/exercises";
import {UpdateExerciseForm} from "./UpdateExerciseForm";

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
