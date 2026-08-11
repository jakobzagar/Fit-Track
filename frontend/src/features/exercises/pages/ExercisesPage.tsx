import {useState} from "react";
import {Button} from "../../../components/ui/Button";
import {Feedback} from "../../../components/ui/Feedback";
import {Icon} from "../../../components/ui/Icon";
import {PageHeader} from "../../../components/ui/PageHeader";
import {SkeletonGrid} from "../../../components/ui/SkeletonGrid";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog";
import {ExerciseFormDialog} from "../components/forms/ExerciseFormDialog";
import {ExerciseEmptyState} from "../components/library/ExerciseEmptyState";
import {ExerciseList} from "../components/library/ExerciseList";
import {ExerciseStatusTabs} from "../components/library/ExerciseStatusTabs";
import type {Exercise} from "../exercise.types";
import {useExercises, type ExerciseView} from "../hooks/useExercises";
import type {CreateExerciseInput, UpdateExerciseInput} from "../schemas/exercise.schemas";

export function ExercisesPage() {
    const confirm = useConfirmDialog();
    const [view, setView] = useState<ExerciseView>("active");
    const exerciseData = useExercises(view);
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

    function changeView(nextView: ExerciseView) {
        if (nextView === view) return;
        setView(nextView);
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
                <Feedback>{exerciseData.loadError}</Feedback>
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
                title="Movements"
                description="Build a clean library of the movements you train. Keep names consistent so your history stays useful."
                action={
                    view === "active" ? (
                        <Button type="button" onClick={openCreateForm}>
                            <Icon name="plus" size={16} />
                            Add exercise
                        </Button>
                    ) : undefined
                }
            />
            {exerciseData.mutationError && <Feedback>{exerciseData.mutationError}</Feedback>}
            {exerciseData.successMessage && (
                <Feedback tone="success" onDismiss={exerciseData.clearSuccess}>
                    {exerciseData.successMessage}
                </Feedback>
            )}

            <ExerciseStatusTabs view={view} onChange={changeView} />

            <div>
                <div className="mb-4">
                    <h2 className="section-title">Your exercises</h2>
                    <p className="section-caption">
                        {exerciseData.exercises.length} {view} movements
                    </p>
                </div>
                {exerciseData.exercises.length === 0 ? (
                    <ExerciseEmptyState view={view} onCreate={openCreateForm} />
                ) : (
                    <ExerciseList
                        exercises={exerciseData.exercises}
                        onArchive={(id) => void confirmStatusChange(id, "archive")}
                        onEdit={(exercise) => {
                            setEditingExercise(exercise);
                            setIsFormOpen(true);
                        }}
                        archivingExerciseId={exerciseData.archivingExerciseId}
                        isArchivedView={view === "archived"}
                        onRestore={(id) => void confirmStatusChange(id, "restore")}
                    />
                )}
            </div>

            {isFormOpen && view === "active" && (
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
