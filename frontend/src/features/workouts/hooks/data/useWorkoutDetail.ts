import {useCallback, useEffect, useRef, useState} from "react";
import type {ConfirmDialogFunction} from "../../../../components/ui/dialogs/confirm-dialog.context";
import {getExercises} from "../../../exercises/api/exercises.api";
import type {Exercise} from "../../../exercises/exercise.types";
import {getWorkoutById} from "../../api/workouts.api";
import type {Workout} from "../../workout.types";
import {useWorkoutExerciseMutations} from "./useWorkoutExerciseMutations";
import {useWorkoutSetMutations} from "./useWorkoutSetMutations";

export function useWorkoutDetail(workoutId: string | undefined, confirm: ConfirmDialogFunction) {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const requestIdRef = useRef(0);
    const exerciseMutations = useWorkoutExerciseMutations(workoutId, confirm, setWorkout);
    const setMutations = useWorkoutSetMutations(workoutId, confirm, setWorkout);
    const {setEditingExercise, setError: setExerciseError} = exerciseMutations;
    const {setEditingSet, setError: setSetError} = setMutations;

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
        } catch (caught) {
            if (requestId === requestIdRef.current)
                setLoadError(caught instanceof Error ? caught.message : "Failed to load workout");
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
            setEditingExercise(null);
            setEditingSet(null);
            setExerciseError("");
            setSetError("");
            setLoadError("");
            setIsLoading(true);
            void load();
        });
        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [load, setEditingExercise, setEditingSet, setExerciseError, setSetError]);

    return {
        workout,
        exercises,
        editingWorkoutExercise: exerciseMutations.editingExercise,
        editingWorkoutSet: setMutations.editingSet,
        deletingWorkoutExerciseId: exerciseMutations.deletingExerciseId,
        deletingWorkoutSetId: setMutations.deletingSetId,
        isLoading,
        loadError,
        mutationError: exerciseMutations.error || setMutations.error,
        setEditingWorkoutExercise: exerciseMutations.setEditingExercise,
        setEditingWorkoutSet: setMutations.setEditingSet,
        addExercise: exerciseMutations.add,
        addSet: setMutations.add,
        updateExercise: exerciseMutations.update,
        removeExercise: exerciseMutations.remove,
        updateSet: setMutations.update,
        removeSet: setMutations.remove,
        retry: () => {
            setIsLoading(true);
            setLoadError("");
            void load();
        },
    };
}
