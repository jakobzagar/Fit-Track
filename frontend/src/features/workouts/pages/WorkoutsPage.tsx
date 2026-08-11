import {useState} from "react";
import {WorkoutFormDialog} from "../components/forms/WorkoutFormDialog.tsx";
import {WorkoutEmptyState} from "../components/list/WorkoutEmptyState.tsx";
import {WorkoutList} from "../components/list/WorkoutList.tsx";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import type {WorkoutSummary} from "../workout.types.ts";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {PageHeader} from "../../../components/ui/PageHeader.tsx";
import {SkeletonGrid} from "../../../components/ui/SkeletonGrid.tsx";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {Icon} from "../../../components/ui/Icon.tsx";
import {useWorkouts} from "../hooks/data/useWorkouts.ts";

export function WorkoutsPage() {
    const confirm = useConfirmDialog();
    const workoutData = useWorkouts();
    const [editingWorkout, setEditingWorkout] = useState<WorkoutSummary | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    function openCreateForm() {
        setEditingWorkout(null);
        setIsFormOpen(true);
    }

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
                    <Button type="button" onClick={openCreateForm}>
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
                    <WorkoutEmptyState onCreate={openCreateForm} />
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
                <WorkoutFormDialog
                    workout={editingWorkout}
                    onCreate={handleCreateWorkout}
                    onUpdate={handleUpdateWorkout}
                    onClose={handleCancelEditWorkout}
                />
            )}
        </section>
    );
}
