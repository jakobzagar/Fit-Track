import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {createWorkoutSummary} from "../../../test/fixtures/workouts";
import {UpdateWorkoutForm} from "../components/forms/UpdateWorkoutForm";

const workout = createWorkoutSummary({status: "DRAFT"});

describe("UpdateWorkoutForm", () => {
    test("prefills and submits normalized changes", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<UpdateWorkoutForm workout={workout} onSubmit={onSubmit} onCancel={vi.fn()} />);

        expect(screen.getByLabelText("Name")).toHaveValue("Push day");
        await user.clear(screen.getByLabelText("Name"));
        await user.type(screen.getByLabelText("Name"), "Upper body");
        await user.clear(screen.getByLabelText("Notes"));
        await user.click(screen.getByRole("button", {name: "Save changes"}));

        expect(onSubmit).toHaveBeenCalledWith({
            name: "Upper body",
            performedAt: "2026-07-26",
            notes: null,
        });
    });

    test("prevents invalid submission and supports cancellation", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const onCancel = vi.fn();
        render(<UpdateWorkoutForm workout={workout} onSubmit={onSubmit} onCancel={onCancel} />);

        await user.clear(screen.getByLabelText("Name"));
        await user.click(screen.getByRole("button", {name: "Save changes"}));
        expect(screen.getByText("Workout name is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", {name: "Cancel"}));
        expect(onCancel).toHaveBeenCalledOnce();
    });
});
