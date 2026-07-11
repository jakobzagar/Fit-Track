import {useEffect, useState} from "react";
import {createWorkout, getWorkouts, deleteWorkout, updateWorkout} from "../api/workouts.api.ts";
import {CreateWorkoutForm} from "../components/CreateWorkoutForm.tsx";
import {UpdateWorkoutForm} from "../components/UpdateWorkoutForm.tsx";
import {WorkoutList} from "../components/WorkoutList.tsx";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import type {WorkoutSummary, WorkoutsResponse} from "../workout.types.ts";

export function WorkoutsPage() {
    const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutSummary | null>(null);
    const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");

    useEffect(() => {
        async function loadWorkouts() {
            try {
                const response: WorkoutsResponse = await getWorkouts();
                setWorkouts(response.workouts);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load workouts");
            } finally {
                setIsLoading(false);
            }
        }

        void loadWorkouts();
    }, []);

    async function handleCreateWorkout(data: CreateWorkoutInput) {
        setMutationError("");

        try {
            const response = await createWorkout(data);

            setWorkouts((currentWorkouts) => [
                {
                    ...response.workout,
                    _count: {
                        workoutExercises: 0,
                    },
                },
                ...currentWorkouts,
            ]);
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create workout");
            throw error;
        }
    }

    async function handleDeleteWorkout(workoutId: string) {
        setMutationError("");
        setDeletingWorkoutId(workoutId);

        try {
            await deleteWorkout(workoutId);

            setWorkouts((currentWorkouts) =>
                currentWorkouts.filter((workout) => workout.id !== workoutId),
            );
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to delete workout");
        } finally {
            setDeletingWorkoutId(null);
        }
    }

    function handleEditWorkout(workout: WorkoutSummary) {
        setEditingWorkout(workout);
    }

    function handleCancelEditWorkout() {
        setEditingWorkout(null);
    }

    async function handleUpdateWorkout(data: UpdateWorkoutInput) {
        if (!editingWorkout) {
            throw new Error("Workout is not selected");
        }

        setMutationError("");

        try {
            const response = await updateWorkout(editingWorkout.id, data);

            setWorkouts((currentWorkouts) =>
                currentWorkouts.map((workout) =>
                    workout.id === editingWorkout.id
                        ? {
                              ...workout,
                              name: response.workout.name,
                              performedAt: response.workout.performedAt,
                              notes: response.workout.notes,
                              updatedAt: response.workout.updatedAt,
                          }
                        : workout,
                ),
            );

            setEditingWorkout(null);
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to update workout");
            throw error;
        }
    }

    if (isLoading) {
        return <p>Loading workouts...</p>;
    }

    if (loadError) {
        return <p>{loadError}</p>;
    }

    return (
        <section>
            <h1>Workouts</h1>

            {mutationError && <p>{mutationError}</p>}

            {editingWorkout ? (
                <UpdateWorkoutForm
                    workout={editingWorkout}
                    onSubmit={handleUpdateWorkout}
                    onCancel={handleCancelEditWorkout}
                />
            ) : (
                <CreateWorkoutForm onSubmit={handleCreateWorkout} />
            )}

            {workouts.length === 0 ? (
                <p>No workouts found</p>
            ) : (
                <WorkoutList
                    workouts={workouts}
                    onDelete={handleDeleteWorkout}
                    onEdit={handleEditWorkout}
                    deletingWorkoutId={deletingWorkoutId}
                />
            )}
        </section>
    );
}
