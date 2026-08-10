import {useCallback, useEffect, useRef, useState} from "react";
import {
    archiveExercise,
    createExercise,
    getExercises,
    restoreExercise,
    updateExercise,
} from "../api/exercises.api";
import type {Exercise, ExercisesResponse} from "../exercise.types";
import type {CreateExerciseInput, UpdateExerciseInput} from "../schemas/exercise.schemas";

export type ExerciseView = "active" | "archived";

export function useExercises(view: ExerciseView) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [archivingExerciseId, setArchivingExerciseId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const requestIdRef = useRef(0);

    const load = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        try {
            const response: ExercisesResponse = await getExercises(view);
            if (requestId === requestIdRef.current) setExercises(response.exercises);
        } catch (error) {
            if (requestId === requestIdRef.current) {
                setLoadError(error instanceof Error ? error.message : "Failed to load exercises");
            }
        } finally {
            if (requestId === requestIdRef.current) setIsLoading(false);
        }
    }, [view]);

    useEffect(() => {
        let isCurrent = true;
        queueMicrotask(() => {
            if (!isCurrent) return;
            setExercises([]);
            setLoadError("");
            setMutationError("");
            setSuccessMessage("");
            setIsLoading(true);
            void load();
        });
        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [load]);

    async function create(data: CreateExerciseInput) {
        setMutationError("");
        setSuccessMessage("");
        try {
            const response = await createExercise(data);
            setExercises((current) => [...current, response.exercise]);
            setSuccessMessage("Exercise created successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create exercise");
            throw error;
        }
    }

    async function update(exerciseId: string, data: UpdateExerciseInput) {
        setMutationError("");
        setSuccessMessage("");
        try {
            const response = await updateExercise(exerciseId, data);
            setExercises((current) =>
                current.map((exercise) =>
                    exercise.id === response.exercise.id ? response.exercise : exercise,
                ),
            );
            setSuccessMessage("Exercise updated successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to update exercise");
            throw error;
        }
    }

    async function archive(exerciseId: string) {
        await runStatusMutation(exerciseId, archiveExercise, "Exercise archived.", "archive");
    }

    async function restore(exerciseId: string) {
        await runStatusMutation(
            exerciseId,
            restoreExercise,
            "Exercise restored to your active library.",
            "restore",
        );
    }

    async function runStatusMutation(
        exerciseId: string,
        mutation: typeof archiveExercise,
        success: string,
        action: "archive" | "restore",
    ) {
        setMutationError("");
        setSuccessMessage("");
        setArchivingExerciseId(exerciseId);
        try {
            await mutation(exerciseId);
            setExercises((current) => current.filter((exercise) => exercise.id !== exerciseId));
            setSuccessMessage(success);
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : `Failed to ${action} exercise`,
            );
        } finally {
            setArchivingExerciseId(null);
        }
    }

    function retry() {
        setIsLoading(true);
        setLoadError("");
        void load();
    }

    return {
        exercises,
        archivingExerciseId,
        isLoading,
        loadError,
        mutationError,
        successMessage,
        clearSuccess: () => setSuccessMessage(""),
        create,
        update,
        archive,
        restore,
        retry,
    };
}
