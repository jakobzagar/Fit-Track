import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import type {WorkoutSet} from "../../../workouts/workout.types";
import {UpdateWorkoutSetForm} from "./UpdateWorkoutSetForm";

const workoutSet: WorkoutSet = {
    id: "123e4567-e89b-42d3-a456-426614174030",
    workoutExerciseId: "123e4567-e89b-42d3-a456-426614174020",
    setNumber: 1,
    reps: 8,
    weight: 80,
    durationSeconds: null,
    completedAt: null,
};

describe("UpdateWorkoutSetForm", () => {
    test("requires reps or duration and submits converted values", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(
            <UpdateWorkoutSetForm workoutSet={workoutSet} onSubmit={onSubmit} onCancel={vi.fn()} />,
        );

        await user.clear(screen.getByLabelText("Reps"));
        await user.click(screen.getByRole("button", {name: "Save set"}));
        expect(screen.getByText("Either reps or durationSeconds is required")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Duration in seconds"), "45");
        await user.clear(screen.getByLabelText("Weight"));
        await user.click(screen.getByRole("button", {name: "Save set"}));
        expect(onSubmit).toHaveBeenCalledWith({reps: null, weight: null, durationSeconds: 45});
    });
});
