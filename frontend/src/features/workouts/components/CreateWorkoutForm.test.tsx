import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {CreateWorkoutForm} from "./CreateWorkoutForm";

describe("CreateWorkoutForm", () => {
    test("validates required and bounded fields", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<CreateWorkoutForm onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Create workout"}));
        expect(screen.getByText("Workout name is required")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Name"), "a".repeat(101));
        await user.type(screen.getByLabelText("Notes"), "a".repeat(1001));
        await user.click(screen.getByRole("button", {name: "Create workout"}));

        expect(screen.getByText("Workout name is too long")).toBeInTheDocument();
        expect(screen.getByText("Notes are too long")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test("normalizes and submits valid workout data", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<CreateWorkoutForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText("Name"), "  Push day  ");
        await user.type(screen.getByLabelText("Performed at"), "2026-07-26");
        await user.type(screen.getByLabelText("Notes"), "  Heavy session  ");
        await user.click(screen.getByRole("button", {name: "Create workout"}));

        expect(onSubmit).toHaveBeenCalledWith({
            name: "Push day",
            performedAt: "2026-07-26T00:00:00.000Z",
            notes: "Heavy session",
        });
        expect(screen.getByLabelText("Name")).toHaveValue("");
    });
});
