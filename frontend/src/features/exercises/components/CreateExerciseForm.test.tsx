import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {CreateExerciseForm} from "./CreateExerciseForm";

describe("CreateExerciseForm", () => {
    test("shows required field errors without submitting", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<CreateExerciseForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Create exercise"}));

        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(screen.getByText("Muscle group is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test("normalizes valid data, omits blank equipment, and resets the form", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<CreateExerciseForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Name"), "  Pull-up  ");
        await user.type(screen.getByLabelText("Muscle group"), "  Back  ");
        await user.type(screen.getByLabelText("Equipment"), "   ");
        await user.click(screen.getByRole("button", {name: "Create exercise"}));

        expect(onSubmit).toHaveBeenCalledWith({name: "Pull-up", muscleGroup: "Back"});
        expect(screen.getByLabelText("Name")).toHaveValue("");
        expect(screen.getByLabelText("Muscle group")).toHaveValue("");
    });
});
