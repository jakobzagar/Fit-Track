import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {NavigateFunction} from "react-router";
import type {ConfirmDialogFunction} from "../../../components/ui/confirm-dialog.context";
import {getExercises} from "../../exercises/api/exercises.api";
import type {Exercise} from "../../exercises/exercise.types";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
    setWorkoutSetCompletion,
    updateWorkoutSet,
} from "../../workout-exercises/api/workout.exercises.api";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutSetInput,
} from "../../workout-exercises/schemas/workout.exercises.schemas";
import {
    finishWorkout,
    getPreviousPerformances,
    getWorkoutById,
    startWorkout,
} from "../api/workouts.api";
import type {PreviousPerformance, Workout, WorkoutSet} from "../workout.types";
import {useUnsavedSessionGuard} from "./useUnsavedSessionGuard";

export function useWorkoutSession(
    workoutId: string | undefined,
    navigate: NavigateFunction,
    confirm: ConfirmDialogFunction,
) {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [previousPerformances, setPreviousPerformances] = useState<PreviousPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinishing, setIsFinishing] = useState(false);
    const [copyingExerciseId, setCopyingExerciseId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [dirtySetIds, setDirtySetIds] = useState<Set<string>>(() => new Set());
    const requestIdRef = useRef(0);
    useUnsavedSessionGuard({dirtySetCount: dirtySetIds.size, isFinishing, confirm});

    const load = useCallback(async () => {
        if (!workoutId) return;
        const requestId = ++requestIdRef.current;
        try {
            const [workoutResponse, exercisesResponse, performancesResponse] = await Promise.all([
                getWorkoutById(workoutId),
                getExercises(),
                getPreviousPerformances(workoutId),
            ]);
            if (requestId !== requestIdRef.current) return;

            let loaded = workoutResponse.workout;
            if (loaded.status === "COMPLETED") {
                void navigate(`/workouts/${workoutId}`, {replace: true});
                return;
            }
            if (loaded.status === "DRAFT") {
                const response = await startWorkout(workoutId);
                if (requestId !== requestIdRef.current) return;
                loaded = {...loaded, ...response.workout};
            }
            setWorkout(loaded);
            setExercises(exercisesResponse.exercises);
            setPreviousPerformances(performancesResponse.previousPerformances);
        } catch (caught) {
            if (requestId === requestIdRef.current) {
                setError(caught instanceof Error ? caught.message : "Failed to load session");
            }
        } finally {
            if (requestId === requestIdRef.current) setIsLoading(false);
        }
    }, [navigate, workoutId]);

    useEffect(() => {
        let isCurrent = true;
        queueMicrotask(() => {
            if (!isCurrent) return;
            setWorkout(null);
            setExercises([]);
            setPreviousPerformances([]);
            setDirtySetIds(new Set());
            setError("");
            setIsFinishing(false);
            setCopyingExerciseId(null);
            setIsLoading(true);
            void load();
        });
        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [load]);

    const onDirtyChange = useCallback((setId: string, dirty: boolean) => {
        setDirtySetIds((current) => {
            const next = new Set(current);
            if (dirty) next.add(setId);
            else next.delete(setId);
            return next;
        });
    }, []);

    const previousByExerciseId = useMemo(
        () => new Map(previousPerformances.map((item) => [item.exerciseId, item])),
        [previousPerformances],
    );

    function replaceSet(workoutExerciseId: string, nextSet: WorkoutSet) {
        setWorkout((current) =>
            current
                ? {
                      ...current,
                      workoutExercises: current.workoutExercises.map((item) =>
                          item.id === workoutExerciseId
                              ? {
                                    ...item,
                                    sets: item.sets.map((set) =>
                                        set.id === nextSet.id ? nextSet : set,
                                    ),
                                }
                              : item,
                      ),
                  }
                : null,
        );
    }

    async function addExercise(data: AddExerciseToWorkoutInput) {
        if (!workoutId) return;
        setError("");
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
            const performances = await getPreviousPerformances(workoutId);
            setPreviousPerformances(performances.previousPerformances);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to add exercise");
            throw caught;
        }
    }

    async function addSet(workoutExerciseId: string, data: CreateWorkoutSetInput) {
        if (!workoutId) return;
        setError("");
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
    }

    async function copyLastSet(workoutExerciseId: string, lastSet: WorkoutSet) {
        setCopyingExerciseId(workoutExerciseId);
        try {
            await addSet(workoutExerciseId, {
                ...(lastSet.reps !== null && {reps: lastSet.reps}),
                ...(lastSet.weight !== null && {weight: lastSet.weight}),
                ...(lastSet.durationSeconds !== null && {durationSeconds: lastSet.durationSeconds}),
            });
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to copy set");
        } finally {
            setCopyingExerciseId(null);
        }
    }

    async function saveSet(workoutExerciseId: string, setId: string, data: UpdateWorkoutSetInput) {
        if (!workoutId) return;
        const response = await updateWorkoutSet(workoutId, workoutExerciseId, setId, data);
        replaceSet(workoutExerciseId, response.workoutExerciseSet);
    }

    async function toggleSet(
        workoutExerciseId: string,
        setId: string,
        completed: boolean,
        data: UpdateWorkoutSetInput,
    ) {
        if (!workoutId) return;
        const response = await setWorkoutSetCompletion(workoutId, workoutExerciseId, setId, {
            ...data,
            completed,
        });
        replaceSet(workoutExerciseId, response.workoutExerciseSet);
    }

    async function finish() {
        if (!workoutId) return;
        setError("");
        if (dirtySetIds.size > 0) {
            setError(
                `Save or complete ${dirtySetIds.size === 1 ? "the edited set" : `all ${dirtySetIds.size} edited sets`} before finishing the workout.`,
            );
            return;
        }
        setIsFinishing(true);
        try {
            await finishWorkout(workoutId);
            void navigate(`/workouts/${workoutId}`, {replace: true});
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to finish workout");
            setIsFinishing(false);
        }
    }

    function exit() {
        if (dirtySetIds.size > 0) {
            void navigate(`/workouts/${workout?.id}`);
            return;
        }
        void confirm({
            title: "Leave active workout?",
            message: "Your saved sets will remain and you can continue this session later.",
            confirmLabel: "Leave session",
        }).then((confirmed) => {
            if (confirmed && workout) void navigate(`/workouts/${workout.id}`);
        });
    }

    function retry() {
        setIsLoading(true);
        setError("");
        void load();
    }
    const completedSetCount =
        workout?.workoutExercises.reduce(
            (count, item) => count + item.sets.filter((set) => set.completedAt !== null).length,
            0,
        ) ?? 0;

    return {
        workout,
        exercises,
        previousByExerciseId,
        completedSetCount,
        isLoading,
        isFinishing,
        copyingExerciseId,
        error,
        addExercise,
        addSet,
        copyLastSet,
        saveSet,
        toggleSet,
        finish,
        exit,
        retry,
        onDirtyChange,
    };
}
