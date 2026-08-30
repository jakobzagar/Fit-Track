import {useState, type Dispatch, type SetStateAction} from "react";
import type {ConfirmDialogFunction} from "../../../../components/ui/dialogs/context/confirm-dialog.context";
import {
    addWorkoutSet,
    deleteWorkoutSet,
    updateWorkoutSet,
} from "../../workout-exercises/api/workout-exercises.api";
import type {CreateWorkoutSetInput, UpdateWorkoutSetInput} from "@fit-track/shared/workouts";
import type {Workout, WorkoutSet} from "@fit-track/shared/workouts";

export function useWorkoutSetMutations(
    workoutId: string | undefined,
    confirm: ConfirmDialogFunction,
    setWorkout: Dispatch<SetStateAction<Workout | null>>,
) {
    const [editingWorkoutSet, setEditingWorkoutSet] = useState<WorkoutSet | null>(null);
    const [deletingWorkoutSetId, setDeletingWorkoutSetId] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function add(workoutExerciseId: string, data: CreateWorkoutSetInput) {
        if (!workoutId) throw new Error("Workout ID is missing");
        setError("");
        try {
            const {workoutSet} = await addWorkoutSet(workoutId, workoutExerciseId, data);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises.map((item) =>
                              item.id === workoutExerciseId
                                  ? {...item, sets: [...item.sets, workoutSet]}
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
        if (!workoutId || !editingWorkoutSet) throw new Error("Workout set is not selected");
        setError("");
        try {
            const {workoutSet} = await updateWorkoutSet(
                workoutId,
                editingWorkoutSet.workoutExerciseId,
                editingWorkoutSet.id,
                data,
            );
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises.map((item) => ({
                              ...item,
                              sets: item.sets.map((set) =>
                                  set.id === editingWorkoutSet.id ? workoutSet : set,
                              ),
                          })),
                      }
                    : null,
            );
            setEditingWorkoutSet(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to update workout set");
            throw caught;
        }
    }

    async function remove(workoutExerciseId: string, workoutSetId: string) {
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
        setDeletingWorkoutSetId(workoutSetId);
        try {
            await deleteWorkoutSet(workoutId, workoutExerciseId, workoutSetId);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises.map((item) =>
                              item.id === workoutExerciseId
                                  ? {
                                        ...item,
                                        sets: item.sets
                                            .filter((set) => set.id !== workoutSetId)
                                            .map((set, index) => ({...set, setNumber: index + 1})),
                                    }
                                  : item,
                          ),
                      }
                    : null,
            );
            setEditingWorkoutSet(null);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to delete workout set");
        } finally {
            setDeletingWorkoutSetId(null);
        }
    }

    return {
        editingWorkoutSet,
        setEditingWorkoutSet,
        deletingWorkoutSetId,
        error,
        setError,
        addWorkoutSet: add,
        updateWorkoutSet: update,
        removeWorkoutSet: remove,
    };
}
