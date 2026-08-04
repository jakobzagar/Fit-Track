import {useState} from "react";
import {CreateWorkoutForm} from "../components/CreateWorkoutForm.tsx";
import {UpdateWorkoutForm} from "../components/UpdateWorkoutForm.tsx";
import {WorkoutList} from "../components/WorkoutList.tsx";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import type {WorkoutSummary} from "../workout.types.ts";
import {Card} from "../../../components/ui/Card.tsx";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {PageHeader} from "../../../components/ui/PageHeader.tsx";
import {SkeletonGrid} from "../../../components/ui/SkeletonGrid.tsx";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {Icon} from "../../../components/ui/Icon.tsx";
import {FormDialog} from "../../../components/ui/FormDialog.tsx";
import {useWorkouts} from "../hooks/useWorkouts.ts";

export function WorkoutsPage() {
    const confirm = useConfirmDialog();
    const workoutData = useWorkouts();
    const [editingWorkout, setEditingWorkout] = useState<WorkoutSummary | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    async function handleCreateWorkout(data: CreateWorkoutInput) {
        await workoutData.create(data);
        setIsFormOpen(false);
    }

    async function handleDeleteWorkout(workoutId: string) {
        const workout = workoutData.workouts.find((item) => item.id === workoutId);
        if (
            !(await confirm({
                title: "Delete workout?",
                message: `${workout?.name ?? "This workout"} and all of its sets will be permanently deleted. This cannot be undone.`,
                confirmLabel: "Delete workout",
                variant: "danger",
            }))
        )
            return;

        await workoutData.remove(workoutId);
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

        await workoutData.update(editingWorkout.id, data);
        setEditingWorkout(null);
        setIsFormOpen(false);
    }

    if (workoutData.isLoading) {
        return <SkeletonGrid />;
    }

    if (workoutData.loadError) {
        return (
            <div className="page-stack">
                <Feedback>{workoutData.loadError}</Feedback>
                <Button className="w-fit" variant="secondary" onClick={workoutData.retry}>
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
            {workoutData.mutationError && <Feedback>{workoutData.mutationError}</Feedback>}
            {workoutData.successMessage && (
                <Feedback tone="success" onDismiss={workoutData.clearSuccess}>
                    {workoutData.successMessage}
                </Feedback>
            )}

            <div>
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <h2 className="section-title">Recent sessions</h2>
                        <p className="section-caption">
                            {workoutData.workouts.length} workouts in your log
                        </p>
                    </div>
                </div>
                {workoutData.workouts.length === 0 ? (
                    <Card className="py-14 text-center">
                        <p className="font-bold text-cream">No sessions logged yet.</p>
                        <p className="mt-2 text-sm text-dim">
                            Create a workout and start your first session.
                        </p>
                        <Button
                            className="mt-6 w-full sm:w-auto"
                            type="button"
                            onClick={() => {
                                setEditingWorkout(null);
                                setIsFormOpen(true);
                            }}
                        >
                            <Icon name="plus" size={16} />
                            Create your first workout
                        </Button>
                    </Card>
                ) : (
                    <WorkoutList
                        workouts={workoutData.workouts}
                        onDelete={handleDeleteWorkout}
                        onEdit={handleEditWorkout}
                        deletingWorkoutId={workoutData.deletingWorkoutId}
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
