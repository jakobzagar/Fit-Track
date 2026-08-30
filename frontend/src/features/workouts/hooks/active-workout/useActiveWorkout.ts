import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type {NavigateFunction} from "react-router";
import type {ConfirmDialogFunction} from "../../../../components/ui/dialogs/context/confirm-dialog.context";
import {getExercises} from "../../../exercises";
import type {Exercise} from "@fit-track/shared/exercises";
import {
    cancelWorkout,
    finishWorkout,
    getPreviousPerformances,
    getWorkoutById,
    startWorkout,
} from "../../api/workouts.api";
import type {PreviousPerformance, Workout} from "@fit-track/shared/workouts";
import {useUnsavedWorkoutGuard} from "./useUnsavedWorkoutGuard";
import {useActiveWorkoutMutations} from "./useActiveWorkoutMutations";

export function useActiveWorkout(
    workoutId: string | undefined,
    navigate: NavigateFunction,
    confirm: ConfirmDialogFunction,
) {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [previousPerformances, setPreviousPerformances] = useState<PreviousPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinishing, setIsFinishing] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState("");
    const [dirtySetIds, setDirtySetIds] = useState<Set<string>>(() => new Set());
    const requestIdRef = useRef(0);
    const mutations = useActiveWorkoutMutations(
        workoutId,
        setWorkout,
        setPreviousPerformances,
        setError,
    );
    const {setCopyingExerciseId} = mutations;
    useUnsavedWorkoutGuard({
        dirtySetCount: dirtySetIds.size,
        isFinishing: isFinishing || isCancelling,
        confirm,
    });

    const loadActiveWorkout = useCallback(async () => {
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
            setIsCancelling(false);
            setCopyingExerciseId(null);
            setIsLoading(true);
            void loadActiveWorkout();
        });
        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [loadActiveWorkout, setCopyingExerciseId]);

    const setWorkoutSetDirty = useCallback((workoutSetId: string, dirty: boolean) => {
        setDirtySetIds((current) => {
            const next = new Set(current);
            if (dirty) next.add(workoutSetId);
            else next.delete(workoutSetId);
            return next;
        });
    }, []);

    const previousByExerciseId = useMemo(
        () => new Map(previousPerformances.map((item) => [item.exerciseId, item])),
        [previousPerformances],
    );

    async function finishActiveWorkout() {
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

    async function cancelActiveWorkout() {
        if (!workoutId) return;
        setError("");
        if (dirtySetIds.size > 0) {
            setError(
                `Save or discard ${dirtySetIds.size === 1 ? "the edited set" : `all ${dirtySetIds.size} edited sets`} before cancelling the session.`,
            );
            return;
        }

        const confirmed = await confirm({
            title: "Cancel active session?",
            message:
                "The workout will return to draft. Saved set values will remain, but completed set checkmarks will be reset.",
            confirmLabel: "Cancel session",
            variant: "danger",
        });
        if (!confirmed) return;

        setIsCancelling(true);
        try {
            await cancelWorkout(workoutId);
            void navigate(`/workouts/${workoutId}`, {replace: true});
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Failed to cancel session");
            setIsCancelling(false);
        }
    }

    function exitActiveWorkout() {
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

    function retryLoad() {
        setIsLoading(true);
        setError("");
        void loadActiveWorkout();
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
        isCancelling,
        copyingExerciseId: mutations.copyingExerciseId,
        error,
        addExerciseToWorkout: mutations.addExerciseToWorkout,
        addWorkoutSet: mutations.addWorkoutSet,
        copyPreviousSet: mutations.copyPreviousSet,
        saveWorkoutSet: mutations.saveWorkoutSet,
        toggleWorkoutSetCompletion: mutations.toggleWorkoutSetCompletion,
        finishActiveWorkout,
        cancelActiveWorkout,
        exitActiveWorkout,
        retryLoad,
        setWorkoutSetDirty,
    };
}
