import {useState, type Dispatch, type SetStateAction} from "react";
import type {ConfirmDialogFunction} from "../../../../components/ui/dialogs/context/confirm-dialog.context";
import {
    addSetToWorkoutExercise,
    deleteWorkoutSet,
    updateWorkoutSet,
} from "../../../workout-exercises/api/workout-exercises.api";
import type {
    CreateWorkoutSetInput,
    UpdateWorkoutSetInput,
} from "../../../workout-exercises/schemas/workout-exercises.schemas";
import type {Workout, WorkoutSet} from "../../types/workout.types";

export function useWorkoutSetMutations(
    workoutId: string | undefined,
    confirm: ConfirmDialogFunction,
    setWorkout: Dispatch<SetStateAction<Workout | null>>,
) {
    const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
    const [deletingSetId, setDeletingSetId] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function add(workoutExerciseId: string, data: CreateWorkoutSetInput) {
        if (!workoutId) throw new Error("Workout ID is missing");
        setError("");
        try {
            const {workoutExerciseSet} = await addSetToWorkoutExercise(
                workoutId,
                workoutExerciseId,
                data,
            );
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises.map((item) =>
                              item.id === workoutExerciseId
                                  ? {...item, sets: [...item.sets, workoutExerciseSet]}
                                  : item,
                          ),
                      }
                    : null,
            );
        } catch (caught) {
            setError(
                caught instanceof Error ? caught.message : "Failed to add set to workout exercise",
            );
            throw caught;
        }
    }

    async function update(data: UpdateWorkoutSetInput) {
        if (!workoutId || !editingSet) throw new Error("Workout set is not selected");
        setError("");
        try {
            const {workoutExerciseSet} = await updateWorkoutSet(
                workoutId,
                editingSet.workoutExerciseId,
                editingSet.id,
                data,
            );
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises.map((item) => ({
                              ...item,
                              sets: item.sets.map((set) =>
                                  set.id === editingSet.id ? workoutExerciseSet : set,
                              ),
                          })),
                      }
                    : null,
            );
            setEditingSet(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to update workout set");
            throw caught;
        }
    }

    async function remove(workoutExerciseId: string, setId: string) {
        if (
            !workoutId ||
            !(await confirm({
                title: "Delete set?",
                message: "This set will be permanently removed from the workout.",
                confirmLabel: "Delete set",
                variant: "danger",
            }))
        )
            return;
        setError("");
        setDeletingSetId(setId);
        try {
            await deleteWorkoutSet(workoutId, workoutExerciseId, setId);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises.map((item) =>
                              item.id === workoutExerciseId
                                  ? {
                                        ...item,
                                        sets: item.sets
                                            .filter((set) => set.id !== setId)
                                            .map((set, index) => ({...set, setNumber: index + 1})),
                                    }
                                  : item,
                          ),
                      }
                    : null,
            );
            setEditingSet(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to delete workout set");
        } finally {
            setDeletingSetId(null);
        }
    }

    return {editingSet, setEditingSet, deletingSetId, error, setError, add, update, remove};
}
