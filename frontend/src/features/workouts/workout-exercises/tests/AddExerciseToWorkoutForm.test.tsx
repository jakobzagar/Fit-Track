import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import {exercise} from "../../../../test/fixtures/exercises";
import {AddExerciseToWorkoutForm} from "../components/exercises/AddExerciseToWorkoutForm";

describe("AddExerciseToWorkoutForm", () => {
    test("explains when no exercise is available", () => {
        render(<AddExerciseToWorkoutForm exercises={[]} onSubmit={vi.fn()} />);
        expect(
            screen.getByText("Every available exercise is already in this workout."),
        ).toBeInTheDocument();
    });

    test("requires a selection and submits normalized notes", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<AddExerciseToWorkoutForm exercises={[exercise]} onSubmit={onSubmit} />);

        await user.click(screen.getByRole("button", {name: "Add exercise"}));
        expect(screen.getByText("Invalid exercise ID")).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText("Exercise"), exercise.id);
        await user.type(screen.getByLabelText("Notes"), "  Control the eccentric  ");
        await user.click(screen.getByRole("button", {name: "Add exercise"}));

        expect(onSubmit).toHaveBeenCalledWith({
            exerciseId: exercise.id,
            notes: "Control the eccentric",
        });
        expect(screen.getByLabelText("Exercise")).toHaveValue("");
    });
});
