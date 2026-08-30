import {useState} from "react";
import {Button} from "../../../components/ui/actions/Button";
import {StatusMessage} from "../../../components/ui/feedback/StatusMessage";
import {Icon} from "../../../components/ui/display/Icon";
import {PageHeader} from "../../../components/ui/display/PageHeader";
import {SkeletonGrid} from "../../../components/ui/display/SkeletonGrid";
import {useConfirmDialog} from "../../../components/ui/dialogs/hooks/useConfirmDialog";
import {ExerciseFormDialog} from "../components/forms/ExerciseFormDialog";
import {ExerciseEmptyState} from "../components/library/ExerciseEmptyState";
import {ExerciseList} from "../components/library/ExerciseList";
import {ExerciseStatusTabs} from "../components/library/ExerciseStatusTabs";
import type {Exercise} from "@fit-track/shared/exercises";
import {useExercises} from "../hooks/useExercises";
import type {
    CreateExerciseInput,
    ExerciseStatus,
    UpdateExerciseInput,
} from "@fit-track/shared/exercises";

export function ExercisesPage() {
    const confirm = useConfirmDialog();
    const [status, setStatus] = useState<ExerciseStatus>("active");
    const exerciseData = useExercises(status);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    function openCreateForm() {
        setEditingExercise(null);
        setIsFormOpen(true);
    }

    function closeForm() {
        setEditingExercise(null);
        setIsFormOpen(false);
    }

    function changeStatus(nextStatus: ExerciseStatus) {
        if (nextStatus === status) return;
        setStatus(nextStatus);
        setEditingExercise(null);
    }

    async function createExercise(data: CreateExerciseInput) {
        await exerciseData.create(data);
        closeForm();
    }

    async function updateExercise(data: UpdateExerciseInput) {
        if (!editingExercise) throw new Error("Exercise is not selected");
        await exerciseData.update(editingExercise.id, data);
        closeForm();
    }

    async function confirmStatusChange(exerciseId: string, action: "archive" | "restore") {
        const exercise = exerciseData.exercises.find((item) => item.id === exerciseId);
        const isArchive = action === "archive";
        const accepted = await confirm({
            title: `${isArchive ? "Archive" : "Restore"} exercise?`,
            message: isArchive
                ? `${exercise?.name ?? "This exercise"} will move to your archive and can be restored later.`
                : `${exercise?.name ?? "This exercise"} will return to your active exercise library.`,
            confirmLabel: isArchive ? "Archive" : "Restore",
        });
        if (!accepted) return;
        await (isArchive ? exerciseData.archive(exerciseId) : exerciseData.restore(exerciseId));
    }

    if (exerciseData.isLoading) return <SkeletonGrid />;
    if (exerciseData.loadError) {
        return (
            <div className="page-stack">
                <StatusMessage>{exerciseData.loadError}</StatusMessage>
                <Button className="w-fit" variant="secondary" onClick={exerciseData.retry}>
                    Try again
                </Button>
            </div>
        );
    }

    return (
        <section className="page-stack">
            <PageHeader
                eyebrow="Exercise library"
                title="Exercises"
                description="Build a clean library of the exercises you train. Keep names consistent so your history stays useful."
                action={
                    status === "active" ? (
                        <Button type="button" onClick={openCreateForm}>
                            <Icon name="plus" size={16} />
                            Add exercise
                        </Button>
                    ) : undefined
                }
            />
            {exerciseData.mutationError && (
                <StatusMessage>{exerciseData.mutationError}</StatusMessage>
            )}
            {exerciseData.successMessage && (
                <StatusMessage tone="success" onDismiss={exerciseData.clearSuccess}>
                    {exerciseData.successMessage}
                </StatusMessage>
            )}

            <ExerciseStatusTabs status={status} onChange={changeStatus} />

            <div>
                <div className="mb-4">
                    <h2 className="section-title">Your exercises</h2>
                    <p className="section-caption">
                        {exerciseData.exercises.length} {status} exercises
                    </p>
                </div>
                {exerciseData.exercises.length === 0 ? (
                    <ExerciseEmptyState status={status} onCreate={openCreateForm} />
                ) : (
                    <ExerciseList
                        exercises={exerciseData.exercises}
                        onArchive={(id) => void confirmStatusChange(id, "archive")}
                        onEdit={(exercise) => {
                            setEditingExercise(exercise);
                            setIsFormOpen(true);
                        }}
                        updatingExerciseStatusId={exerciseData.updatingExerciseStatusId}
                        isArchivedView={status === "archived"}
                        onRestore={(id) => void confirmStatusChange(id, "restore")}
                    />
                )}
            </div>

            {isFormOpen && status === "active" && (
                <ExerciseFormDialog
                    exercise={editingExercise}
                    onCreate={createExercise}
                    onUpdate={updateExercise}
                    onClose={closeForm}
                />
            )}
        </section>
    );
}
