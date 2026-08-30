import {useState, type Dispatch, type SetStateAction} from "react";
import type {ConfirmDialogFunction} from "../../../../components/ui/dialogs/context/confirm-dialog.context";
import {
    addExerciseToWorkout,
    deleteWorkoutExercise,
    updateWorkoutExercise,
} from "../../workout-exercises/api/workout-exercises.api";
import type {
    AddExerciseToWorkoutInput,
    UpdateWorkoutExerciseInput,
} from "@fit-track/shared/workouts";
import type {Workout, WorkoutExercise} from "@fit-track/shared/workouts";

export function useWorkoutExerciseMutations(
    workoutId: string | undefined,
    confirm: ConfirmDialogFunction,
    setWorkout: Dispatch<SetStateAction<Workout | null>>,
) {
    const [editingWorkoutExercise, setEditingWorkoutExercise] = useState<WorkoutExercise | null>(
        null,
    );
    const [deletingWorkoutExerciseId, setDeletingWorkoutExerciseId] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function add(data: AddExerciseToWorkoutInput) {
        if (!workoutId) throw new Error("Workout ID is missing");
        setError("");
        try {
            const {workoutExercise} = await addExerciseToWorkout(workoutId, data);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: [
                              ...current.workoutExercises,
                              {...workoutExercise, sets: []},
                          ],
                      }
                    : null,
            );
        } catch (caught) {
            setError(
                caught instanceof Error ? caught.message : "Failed to add exercise to workout",
            );
            throw caught;
        }
    }

    async function update(data: UpdateWorkoutExerciseInput) {
        if (!workoutId || !editingWorkoutExercise)
            throw new Error("Workout exercise is not selected");
        setError("");
        try {
            const previousPosition = editingWorkoutExercise.position;
            const {workoutExercise} = await updateWorkoutExercise(
                workoutId,
                editingWorkoutExercise.id,
                data,
            );
            const nextPosition = workoutExercise.position;
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises
                              .map((item) => {
                                  if (item.id === editingWorkoutExercise.id) return workoutExercise;
                                  if (
                                      nextPosition < previousPosition &&
                                      item.position >= nextPosition &&
                                      item.position < previousPosition
                                  )
                                      return {...item, position: item.position + 1};
                                  if (
                                      nextPosition > previousPosition &&
                                      item.position > previousPosition &&
                                      item.position <= nextPosition
                                  )
                                      return {...item, position: item.position - 1};
                                  return item;
                              })
                              .sort((a, b) => a.position - b.position),
                      }
                    : null,
            );
            setEditingWorkoutExercise(null);
        } catch (caught) {
            setError(
                caught instanceof Error ? caught.message : "Failed to update workout exercise",
            );
            throw caught;
        }
    }

    async function remove(workoutExerciseId: string) {
        if (
            !workoutId ||
            !(await confirm({
                title: "Remove exercise?",
                message: "This exercise and all of its sets will be removed from the workout.",
                confirmLabel: "Remove exercise",
                variant: "danger",
            }))
        )
            return;
        setError("");
        setDeletingWorkoutExerciseId(workoutExerciseId);
        try {
            await deleteWorkoutExercise(workoutId, workoutExerciseId);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises
                              .filter((item) => item.id !== workoutExerciseId)
                              .map((item, index) => ({...item, position: index + 1})),
                      }
                    : null,
            );
            setEditingWorkoutExercise(null);
        } catch (caught) {
            setError(
                caught instanceof Error ? caught.message : "Failed to delete workout exercise",
            );
        } finally {
            setDeletingWorkoutExerciseId(null);
        }
    }

    return {
        editingWorkoutExercise,
        setEditingWorkoutExercise,
        deletingWorkoutExerciseId,
        error,
        setError,
        addExerciseToWorkout: add,
        updateWorkoutExercise: update,
        removeWorkoutExercise: remove,
    };
}
