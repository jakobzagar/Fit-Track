import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test, vi} from "vitest";
import type {WorkoutSet} from "@fit-track/shared/workouts";
import {WorkoutSetInlineRow} from "../components/sets/WorkoutSetInlineRow";

const workoutSet: WorkoutSet = {
    id: "123e4567-e89b-42d3-a456-426614174030",
    workoutExerciseId: "123e4567-e89b-42d3-a456-426614174020",
    setNumber: 1,
    reps: 8,
    weight: 80,
    durationSeconds: null,
    completedAt: null,
};

describe("WorkoutSetInlineRow", () => {
    test("saves edited values and completes the set in one action", async () => {
        const user = userEvent.setup();
        const onSave = vi.fn().mockResolvedValue(undefined);
        const onToggleCompletion = vi.fn().mockResolvedValue(undefined);
        render(
            <WorkoutSetInlineRow
                workoutSet={workoutSet}
                disabled={false}
                onSave={onSave}
                onToggleCompletion={onToggleCompletion}
            />,
        );

        await user.clear(screen.getByLabelText("Reps"));
        await user.type(screen.getByLabelText("Reps"), "10");
        await user.click(screen.getByRole("button", {name: "Save & complete"}));

        expect(onSave).not.toHaveBeenCalled();
        expect(onToggleCompletion).toHaveBeenCalledWith(true, {
            reps: 10,
            weight: 80,
            durationSeconds: null,
        });
    });

    test("reports when values become dirty and are saved", async () => {
        const user = userEvent.setup();
        const onDirtyChange = vi.fn();
        render(
            <WorkoutSetInlineRow
                workoutSet={workoutSet}
                disabled={false}
                onSave={vi.fn().mockResolvedValue(undefined)}
                onToggleCompletion={vi.fn()}
                onDirtyChange={onDirtyChange}
            />,
        );

        await user.clear(screen.getByLabelText("Reps"));
        await user.type(screen.getByLabelText("Reps"), "10");
        expect(onDirtyChange).toHaveBeenLastCalledWith(workoutSet.id, true);

        await user.click(screen.getByRole("button", {name: "Save"}));
        expect(onDirtyChange).toHaveBeenLastCalledWith(workoutSet.id, false);
    });

    test("rejects empty performance values", async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();
        render(
            <WorkoutSetInlineRow
                workoutSet={{...workoutSet, reps: null}}
                disabled={false}
                onSave={onSave}
                onToggleCompletion={vi.fn()}
            />,
        );

        await user.click(screen.getByRole("button", {name: "Complete"}));
        expect(screen.getByText("Either reps or durationSeconds is required")).toBeInTheDocument();
        expect(onSave).not.toHaveBeenCalled();
    });
});
