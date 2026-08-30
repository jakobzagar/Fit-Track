import {useCallback, useEffect, useRef, useState} from "react";
import {createWorkout, deleteWorkout, getWorkouts, updateWorkout} from "../../api/workouts.api";
import type {
    CreateWorkoutInput,
    UpdateWorkoutInput,
    WorkoutsResponse,
    WorkoutSummary,
} from "@fit-track/shared/workouts";

function sortWorkoutsByPerformedAt(workouts: WorkoutSummary[]) {
    return [...workouts].sort(
        (left, right) => Date.parse(right.performedAt) - Date.parse(left.performedAt),
    );
}

export function useWorkouts() {
    const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
    const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const requestIdRef = useRef(0);

    const load = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        try {
            const response: WorkoutsResponse = await getWorkouts();
            if (requestId === requestIdRef.current) setWorkouts(response.workouts);
        } catch (error) {
            if (requestId === requestIdRef.current) {
                setLoadError(error instanceof Error ? error.message : "Failed to load workouts");
            }
        } finally {
            if (requestId === requestIdRef.current) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isCurrent = true;
        queueMicrotask(() => {
            if (isCurrent) void load();
        });
        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [load]);

    async function create(data: CreateWorkoutInput) {
        setMutationError("");
        setSuccessMessage("");
        try {
            const response = await createWorkout(data);
            setWorkouts((current) =>
                sortWorkoutsByPerformedAt([
                    ...current,
                    {...response.workout, _count: {workoutExercises: 0}},
                ]),
            );
            setSuccessMessage("Workout created successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create workout");
            throw error;
        }
    }

    async function update(workoutId: string, data: UpdateWorkoutInput) {
        setMutationError("");
        setSuccessMessage("");
        try {
            const response = await updateWorkout(workoutId, data);
            setWorkouts((current) =>
                sortWorkoutsByPerformedAt(
                    current.map((workout) =>
                        workout.id === workoutId
                            ? {
                                  ...workout,
                                  name: response.workout.name,
                                  performedAt: response.workout.performedAt,
                                  notes: response.workout.notes,
                                  updatedAt: response.workout.updatedAt,
                              }
                            : workout,
                    ),
                ),
            );
            setSuccessMessage("Workout updated successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to update workout");
            throw error;
        }
    }

    async function remove(workoutId: string) {
        setMutationError("");
        setSuccessMessage("");
        setDeletingWorkoutId(workoutId);
        try {
            await deleteWorkout(workoutId);
            setWorkouts((current) => current.filter((workout) => workout.id !== workoutId));
            setSuccessMessage("Workout deleted.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to delete workout");
        } finally {
            setDeletingWorkoutId(null);
        }
    }

    function retry() {
        setIsLoading(true);
        setLoadError("");
        void load();
    }

    return {
        workouts,
        deletingWorkoutId,
        isLoading,
        loadError,
        mutationError,
        successMessage,
        clearSuccess: () => setSuccessMessage(""),
        create,
        update,
        remove,
        retry,
    };
}
