import {useCallback, useEffect, useRef, useState} from "react";
import type {ConfirmDialogFunction} from "../../../../components/ui/dialogs/context/confirm-dialog.context";
import {getExercises} from "../../../exercises/api/exercises.api";
import type {Exercise} from "@fit-track/shared/exercises";
import {getWorkoutById, reopenWorkout} from "../../api/workouts.api";
import type {Workout} from "@fit-track/shared/workouts";
import {useWorkoutExerciseMutations} from "./useWorkoutExerciseMutations";
import {useWorkoutSetMutations} from "./useWorkoutSetMutations";

export function useWorkoutDetail(workoutId: string | undefined, confirm: ConfirmDialogFunction) {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [lifecycleError, setLifecycleError] = useState("");
    const [isReopening, setIsReopening] = useState(false);
    const requestIdRef = useRef(0);
    const exerciseMutations = useWorkoutExerciseMutations(workoutId, confirm, setWorkout);
    const setMutations = useWorkoutSetMutations(workoutId, confirm, setWorkout);
    const {setEditingWorkoutExercise, setError: setExerciseError} = exerciseMutations;
    const {setEditingWorkoutSet, setError: setSetError} = setMutations;

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
            setEditingWorkoutExercise(null);
            setEditingWorkoutSet(null);
            setExerciseError("");
            setSetError("");
            setLoadError("");
            setLifecycleError("");
            setIsReopening(false);
            setIsLoading(true);
            void load();
        });
        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [load, setEditingWorkoutExercise, setEditingWorkoutSet, setExerciseError, setSetError]);

    async function reopen() {
        if (!workoutId) return false;
        setLifecycleError("");
        setIsReopening(true);
        try {
            const response = await reopenWorkout(workoutId);
            setWorkout((current) => (current ? {...current, ...response.workout} : current));
            return true;
        } catch (caught) {
            setLifecycleError(
                caught instanceof Error ? caught.message : "Failed to reopen workout",
            );
            return false;
        } finally {
            setIsReopening(false);
        }
    }

    return {
        workout,
        exercises,
        editingWorkoutExercise: exerciseMutations.editingWorkoutExercise,
        editingWorkoutSet: setMutations.editingWorkoutSet,
        deletingWorkoutExerciseId: exerciseMutations.deletingWorkoutExerciseId,
        deletingWorkoutSetId: setMutations.deletingWorkoutSetId,
        isLoading,
        isReopening,
        loadError,
        mutationError: lifecycleError || exerciseMutations.error || setMutations.error,
        setEditingWorkoutExercise: exerciseMutations.setEditingWorkoutExercise,
        setEditingWorkoutSet: setMutations.setEditingWorkoutSet,
        addExerciseToWorkout: exerciseMutations.addExerciseToWorkout,
        addWorkoutSet: setMutations.addWorkoutSet,
        updateWorkoutExercise: exerciseMutations.updateWorkoutExercise,
        removeWorkoutExercise: exerciseMutations.removeWorkoutExercise,
        updateWorkoutSet: setMutations.updateWorkoutSet,
        removeWorkoutSet: setMutations.removeWorkoutSet,
        reopen,
        retry: () => {
            setIsLoading(true);
            setLoadError("");
            void load();
        },
    };
}
