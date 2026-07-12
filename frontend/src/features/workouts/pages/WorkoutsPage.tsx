import {useEffect, useState} from "react";
import {createWorkout, getWorkouts, deleteWorkout, updateWorkout} from "../api/workouts.api.ts";
import {CreateWorkoutForm} from "../components/CreateWorkoutForm.tsx";
import {UpdateWorkoutForm} from "../components/UpdateWorkoutForm.tsx";
import {WorkoutList} from "../components/WorkoutList.tsx";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import type {WorkoutSummary, WorkoutsResponse} from "../workout.types.ts";
import {Card} from "../../../components/ui/Card.tsx";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {PageHeader} from "../../../components/ui/PageHeader.tsx";
import {SkeletonGrid} from "../../../components/ui/SkeletonGrid.tsx";

export function WorkoutsPage() {
    const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutSummary | null>(null);
    const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

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
        setSuccessMessage("");

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
            setSuccessMessage("Workout created successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create workout");
            throw error;
        }
    }

    async function handleDeleteWorkout(workoutId: string) {
        const workout = workouts.find((item) => item.id === workoutId);
        if (!window.confirm(`Delete ${workout?.name ?? "this workout"} and all of its sets?`))
            return;

        setMutationError("");
        setSuccessMessage("");
        setDeletingWorkoutId(workoutId);

        try {
            await deleteWorkout(workoutId);

            setWorkouts((currentWorkouts) =>
                currentWorkouts.filter((workout) => workout.id !== workoutId),
            );
            setSuccessMessage("Workout deleted.");
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
        setSuccessMessage("");

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
            setSuccessMessage("Workout updated successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to update workout");
            throw error;
        }
    }

    if (isLoading) {
        return <SkeletonGrid />;
    }

    if (loadError) {
        return <Feedback>{loadError}</Feedback>;
    }

    return (
        <section className="page-stack">
            <PageHeader
                eyebrow="Training log"
                title="Workouts"
                description="Plan the session, log the work and leave with a record you can build on next time."
            />
            {mutationError && <Feedback>{mutationError}</Feedback>}
            {successMessage && <Feedback tone="success">{successMessage}</Feedback>}

            <div className="content-grid">
                <div>
                    <div className="mb-4 flex items-end justify-between">
                        <div>
                            <h2 className="section-title">Recent sessions</h2>
                            <p className="section-caption">
                                {workouts.length} workouts in your log
                            </p>
                        </div>
                    </div>
                    {workouts.length === 0 ? (
                        <Card className="py-14 text-center">
                            <p className="font-bold text-cream">No sessions logged yet.</p>
                            <p className="mt-2 text-sm text-dim">
                                Create a workout and start your first session.
                            </p>
                        </Card>
                    ) : (
                        <WorkoutList
                            workouts={workouts}
                            onDelete={handleDeleteWorkout}
                            onEdit={handleEditWorkout}
                            deletingWorkoutId={deletingWorkoutId}
                        />
                    )}
                </div>
                <Card as="aside" className="sticky top-24">
                    {editingWorkout ? (
                        <UpdateWorkoutForm
                            workout={editingWorkout}
                            onSubmit={handleUpdateWorkout}
                            onCancel={handleCancelEditWorkout}
                        />
                    ) : (
                        <>
                            <div className="mb-6">
                                <p className="eyebrow">Next session</p>
                                <h2 className="section-title mt-2">Create workout</h2>
                                <p className="section-caption">
                                    Give it a clear name. You can add exercises after creating it.
                                </p>
                            </div>
                            <CreateWorkoutForm onSubmit={handleCreateWorkout} />
                        </>
                    )}
                </Card>
            </div>
        </section>
    );
}
