import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {NavigateFunction} from "react-router";
import type {ConfirmDialogFunction} from "../../../../components/ui/confirm-dialog.context";
import {getExercises} from "../../../exercises/api/exercises.api";
import type {Exercise} from "../../../exercises/exercise.types";
import {
    finishWorkout,
    getPreviousPerformances,
    getWorkoutById,
    startWorkout,
} from "../../api/workouts.api";
import type {PreviousPerformance, Workout} from "../../workout.types";
import {useUnsavedSessionGuard} from "./useUnsavedSessionGuard";
import {useWorkoutSessionMutations} from "./useWorkoutSessionMutations";

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
    const [error, setError] = useState("");
    const [dirtySetIds, setDirtySetIds] = useState<Set<string>>(() => new Set());
    const requestIdRef = useRef(0);
    const mutations = useWorkoutSessionMutations(
        workoutId,
        setWorkout,
        setPreviousPerformances,
        setError,
    );
    const {setCopyingExerciseId} = mutations;
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
    }, [load, setCopyingExerciseId]);

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
        copyingExerciseId: mutations.copyingExerciseId,
        error,
        addExercise: mutations.addExercise,
        addSet: mutations.addSet,
        copyLastSet: mutations.copyLastSet,
        saveSet: mutations.saveSet,
        toggleSet: mutations.toggleSet,
        finish,
        exit,
        retry,
        onDirtyChange,
    };
}
