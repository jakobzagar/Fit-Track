import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {ApiError} from "../../../../common/errors/api.error";
import {AddWorkoutSetForm} from "../components/sets/AddWorkoutSetForm";

describe("AddWorkoutSetForm", () => {
    test("requires reps or duration", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<AddWorkoutSetForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Add set"}));

        expect(screen.getByText("Either reps or durationSeconds is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test("converts numeric inputs and clears them after submission", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<AddWorkoutSetForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Reps"), "8");
        await user.type(screen.getByLabelText("Weight"), "82.5");
        await user.click(screen.getByRole("button", {name: "Add set"}));

        expect(onSubmit).toHaveBeenCalledWith({reps: 8, weight: 82.5});
        expect(screen.getByLabelText("Reps")).toHaveValue(null);
    });

    test("shows a server form validation error", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockRejectedValue(
            new ApiError("Validation failed", 400, {
                fieldErrors: {},
                formErrors: ["Reps or duration must be provided"],
            }),
        );
        render(<AddWorkoutSetForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Reps"), "8");
        await user.click(screen.getByRole("button", {name: "Add set"}));

        expect(screen.getByText("Reps or duration must be provided")).toBeInTheDocument();
    });
});
