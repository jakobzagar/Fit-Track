import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {NewWorkoutSetInlineRow} from "../components/sets/NewWorkoutSetInlineRow";

describe("NewWorkoutSetInlineRow", () => {
    test("requires reps or duration and submits numeric values", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<NewWorkoutSetInlineRow setNumber={2} onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Add"}));
        expect(screen.getByText("Either reps or durationSeconds is required")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Weight (kg)"), "80");
        await user.type(screen.getByLabelText("Reps"), "10");
        await user.click(screen.getByRole("button", {name: "Add"}));

        expect(onSubmit).toHaveBeenCalledWith({weight: 80, reps: 10});
        expect(screen.getByLabelText("Reps")).toHaveValue(null);
    });
});
