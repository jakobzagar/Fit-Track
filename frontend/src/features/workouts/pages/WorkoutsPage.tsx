import {useCallback, useEffect, useState} from "react";
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
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {Icon} from "../../../components/ui/Icon.tsx";
import {FormDialog} from "../../../components/ui/FormDialog.tsx";

export function WorkoutsPage() {
    const confirm = useConfirmDialog();
    const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutSummary | null>(null);
    const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);

    const loadWorkouts = useCallback(async () => {
        try {
            const response: WorkoutsResponse = await getWorkouts();
            setWorkouts(response.workouts);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load workouts");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        async function loadInitialWorkouts() {
            try {
                const response: WorkoutsResponse = await getWorkouts();
                setWorkouts(response.workouts);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load workouts");
            } finally {
                setIsLoading(false);
            }
        }

        void loadInitialWorkouts();
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
            setIsFormOpen(false);
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create workout");
            throw error;
        }
    }

    async function handleDeleteWorkout(workoutId: string) {
        const workout = workouts.find((item) => item.id === workoutId);
        if (
            !(await confirm({
                title: "Delete workout?",
                message: `${workout?.name ?? "This workout"} and all of its sets will be permanently deleted. This cannot be undone.`,
                confirmLabel: "Delete workout",
                variant: "danger",
            }))
        )
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
        setIsFormOpen(true);
    }

    function handleCancelEditWorkout() {
        setEditingWorkout(null);
        setIsFormOpen(false);
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
            setIsFormOpen(false);
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
        return (
            <div className="page-stack">
                <Feedback>{loadError}</Feedback>
                <Button
                    className="w-fit"
                    variant="secondary"
                    onClick={() => {
                        setIsLoading(true);
                        setLoadError("");
                        void loadWorkouts();
                    }}
                >
                    Try again
                </Button>
            </div>
        );
    }

    return (
        <section className="page-stack">
            <PageHeader
                eyebrow="Training log"
                title="Workouts"
                description="Plan the session, log the work and leave with a record you can build on next time."
                action={
                    <Button
                        type="button"
                        onClick={() => {
                            setEditingWorkout(null);
                            setIsFormOpen(true);
                        }}
                    >
                        <Icon name="plus" size={16} />
                        Create workout
                    </Button>
                }
            />
            {mutationError && <Feedback>{mutationError}</Feedback>}
            {successMessage && (
                <Feedback tone="success" onDismiss={() => setSuccessMessage("")}>
                    {successMessage}
                </Feedback>
            )}

            <div>
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <h2 className="section-title">Recent sessions</h2>
                        <p className="section-caption">{workouts.length} workouts in your log</p>
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

            {isFormOpen && (
                <FormDialog
                    title={editingWorkout ? "Edit workout" : "Create workout"}
                    description={
                        editingWorkout
                            ? "Update the session details without leaving your training log."
                            : "Create the session first, then add exercises and working sets."
                    }
                    onClose={handleCancelEditWorkout}
                >
                    {editingWorkout ? (
                        <UpdateWorkoutForm
                            workout={editingWorkout}
                            onSubmit={handleUpdateWorkout}
                            onCancel={handleCancelEditWorkout}
                        />
                    ) : (
                        <CreateWorkoutForm onSubmit={handleCreateWorkout} />
                    )}
                </FormDialog>
            )}
        </section>
    );
}
