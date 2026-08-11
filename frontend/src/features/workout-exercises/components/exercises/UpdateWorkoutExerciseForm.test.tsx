import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import type {WorkoutExercise} from "../../../workouts/workout.types";
import {UpdateWorkoutExerciseForm} from "./UpdateWorkoutExerciseForm";

const workoutExercise: WorkoutExercise = {
    id: "123e4567-e89b-42d3-a456-426614174020",
    workoutId: "123e4567-e89b-42d3-a456-426614174010",
    exerciseId: "123e4567-e89b-42d3-a456-426614174001",
    position: 1,
    notes: "Controlled reps",
    exercise: {
        id: "123e4567-e89b-42d3-a456-426614174001",
        name: "Bench press",
        muscleGroup: "Chest",
        equipment: "Barbell",
    },
    sets: [],
};

describe("UpdateWorkoutExerciseForm", () => {
    test("validates position and submits cleared notes as null", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(
            <UpdateWorkoutExerciseForm
                workoutExercise={workoutExercise}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
            />,
        );

        await user.clear(screen.getByLabelText("Position"));
        await user.type(screen.getByLabelText("Position"), "0");
        await user.click(screen.getByRole("button", {name: "Save exercise"}));
        expect(screen.getByText("Position must be greater than zero")).toBeInTheDocument();

        await user.clear(screen.getByLabelText("Position"));
        await user.type(screen.getByLabelText("Position"), "2");
        await user.clear(screen.getByLabelText("Notes"));
        await user.click(screen.getByRole("button", {name: "Save exercise"}));
        expect(onSubmit).toHaveBeenCalledWith({position: 2, notes: null});
    });
});
