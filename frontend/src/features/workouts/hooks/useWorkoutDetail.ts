import {useCallback, useEffect, useRef, useState} from "react";
import type {ConfirmDialogFunction} from "../../../components/ui/confirm-dialog.context";
import {getExercises} from "../../exercises/api/exercises.api";
import type {Exercise} from "../../exercises/exercise.types";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
    deleteWorkoutExercise,
    deleteWorkoutSet,
    updateWorkoutExercise,
    updateWorkoutSet,
} from "../../workout-exercises/api/workout.exercises.api";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
} from "../../workout-exercises/schemas/workout.exercises.schemas";
import {getWorkoutById} from "../api/workouts.api";
import type {Workout, WorkoutExercise, WorkoutSet} from "../workout.types";

export function useWorkoutDetail(workoutId: string | undefined, confirm: ConfirmDialogFunction) {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [editingWorkoutExercise, setEditingWorkoutExercise] = useState<WorkoutExercise | null>(
        null,
    );
    const [editingWorkoutSet, setEditingWorkoutSet] = useState<WorkoutSet | null>(null);
    const [deletingWorkoutExerciseId, setDeletingWorkoutExerciseId] = useState<string | null>(null);
    const [deletingWorkoutSetId, setDeletingWorkoutSetId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const requestIdRef = useRef(0);

    const load = useCallback(async () => {
        if (!workoutId) return;
        const requestId = ++requestIdRef.current;
        try {
            const [workoutResponse, exercisesResponse] = await Promise.all([
                getWorkoutById(workoutId),
                getExercises(),
            ]);
            if (requestId !== requestIdRef.current) return;
            setWorkout(workoutResponse.workout);
            setExercises(exercisesResponse.exercises);
        } catch (error) {
            if (requestId === requestIdRef.current) {
                setLoadError(error instanceof Error ? error.message : "Failed to load workout");
            }
        } finally {
            if (requestId === requestIdRef.current) setIsLoading(false);
        }
    }, [workoutId]);

    useEffect(() => {
        let isCurrent = true;
        queueMicrotask(() => {
            if (!isCurrent) return;
            setWorkout(null);
            setExercises([]);
            setEditingWorkoutExercise(null);
            setEditingWorkoutSet(null);
            setLoadError("");
            setMutationError("");
            setIsLoading(true);
            void load();
        });
        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [load]);

    async function addExercise(data: AddExerciseToWorkoutInput) {
        if (!workoutId) throw new Error("Workout ID is missing");
        setMutationError("");
        try {
            const response = await addExerciseToWorkout(workoutId, data);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: [
                              ...current.workoutExercises,
                              {...response.workoutExercise, sets: []},
                          ],
                      }
                    : null,
            );
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to add exercise to workout",
            );
            throw error;
        }
    }

    async function addSet(workoutExerciseId: string, data: CreateWorkoutSetInput) {
        if (!workoutId) throw new Error("Workout ID is missing");
        setMutationError("");
        try {
            const response = await addSetToWorkoutExercise(workoutId, workoutExerciseId, data);
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises.map((item) =>
                              item.id === workoutExerciseId
                                  ? {...item, sets: [...item.sets, response.workoutExerciseSet]}
                                  : item,
                          ),
                      }
                    : null,
            );
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to add set to workout exercise",
            );
            throw error;
        }
    }

    async function updateExercise(data: UpdateWorkoutExerciseInput) {
        if (!workoutId || !editingWorkoutExercise)
            throw new Error("Workout exercise is not selected");
        setMutationError("");
        try {
            const previousPosition = editingWorkoutExercise.position;
            const response = await updateWorkoutExercise(
                workoutId,
                editingWorkoutExercise.id,
                data,
            );
            const nextPosition = response.workoutExercise.position;
            setWorkout((current) =>
                current
                    ? {
                          ...current,
                          workoutExercises: current.workoutExercises
                              .map((item) => {
                                  if (item.id === editingWorkoutExercise.id)
                                      return response.workoutExercise;
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
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to update workout exercise",
            );
            throw error;
        }
    }

    async function removeExercise(workoutExerciseId: string) {
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
        setMutationError("");
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
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to delete workout exercise",
            );
        } finally {
            setDeletingWorkoutExerciseId(null);
        }
    }

    async function updateSet(data: UpdateWorkoutSetInput) {
        if (!workoutId || !editingWorkoutSet) throw new Error("Workout set is not selected");
        setMutationError("");
        try {
            const response = await updateWorkoutSet(
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
                                  set.id === editingWorkoutSet.id
                                      ? response.workoutExerciseSet
                                      : set,
                              ),
                          })),
                      }
                    : null,
            );
            setEditingWorkoutSet(null);
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to update workout set",
            );
            throw error;
        }
    }

    async function removeSet(workoutExerciseId: string, setId: string) {
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
        setMutationError("");
        setDeletingWorkoutSetId(setId);
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
            setEditingWorkoutSet(null);
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to delete workout set",
            );
        } finally {
            setDeletingWorkoutSetId(null);
        }
    }

    function retry() {
        setIsLoading(true);
        setLoadError("");
        void load();
    }

    return {
        workout,
        exercises,
        editingWorkoutExercise,
        editingWorkoutSet,
        deletingWorkoutExerciseId,
        deletingWorkoutSetId,
        isLoading,
        loadError,
        mutationError,
        setEditingWorkoutExercise,
        setEditingWorkoutSet,
        addExercise,
        addSet,
        updateExercise,
        removeExercise,
        updateSet,
        removeSet,
        retry,
    };
}
