import {useState} from "react";
import {ExerciseList} from "../components/ExerciseList.tsx";
import type {Exercise} from "../exercise.types.ts";
import type {CreateExerciseInput, UpdateExerciseInput} from "../schemas/exercise.schemas.ts";
import {CreateExerciseForm} from "../components/CreateExerciseForm.tsx";
import {UpdateExerciseForm} from "../components/UpdateExerciseForm.tsx";
import {Card} from "../../../components/ui/Card.tsx";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {PageHeader} from "../../../components/ui/PageHeader.tsx";
import {SkeletonGrid} from "../../../components/ui/SkeletonGrid.tsx";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {Icon} from "../../../components/ui/Icon.tsx";
import {FormDialog} from "../../../components/ui/FormDialog.tsx";
import {useExercises, type ExerciseView} from "../hooks/useExercises.ts";

export function ExercisesPage() {
    const confirm = useConfirmDialog();
    const [view, setView] = useState<ExerciseView>("active");
    const exerciseData = useExercises(view);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    function changeView(nextView: "active" | "archived") {
        if (nextView === view) return;
        setView(nextView);
        setEditingExercise(null);
    }

    async function handleCreateExercise(data: CreateExerciseInput) {
        await exerciseData.create(data);
        setIsFormOpen(false);
    }

    async function handleArchiveExercise(exerciseId: string) {
        const exercise = exerciseData.exercises.find((item) => item.id === exerciseId);
        if (
            !(await confirm({
                title: "Archive exercise?",
                message: `${exercise?.name ?? "This exercise"} will move to your archive and can be restored later.`,
                confirmLabel: "Archive",
            }))
        )
            return;

        await exerciseData.archive(exerciseId);
    }

    async function handleRestoreExercise(exerciseId: string) {
        const exercise = exerciseData.exercises.find((item) => item.id === exerciseId);
        if (
            !(await confirm({
                title: "Restore exercise?",
                message: `${exercise?.name ?? "This exercise"} will return to your active exercise library.`,
                confirmLabel: "Restore",
            }))
        )
            return;

        await exerciseData.restore(exerciseId);
    }

    function handleEditExercise(exercise: Exercise) {
        setEditingExercise(exercise);
        setIsFormOpen(true);
    }

    function handleCancelExercise() {
        setEditingExercise(null);
        setIsFormOpen(false);
    }

    async function handleUpdateExercise(data: UpdateExerciseInput) {
        if (!editingExercise) {
            throw new Error("Exercise is not selected");
        }

        await exerciseData.update(editingExercise.id, data);
        setEditingExercise(null);
        setIsFormOpen(false);
    }

    if (exerciseData.isLoading) {
        return <SkeletonGrid />;
    }

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
                        <Button
                            type="button"
                            onClick={() => {
                                setEditingExercise(null);
                                setIsFormOpen(true);
                            }}
                        >
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

            <div
                className="inline-flex w-fit rounded-[11px] border border-line bg-panel p-1"
                role="tablist"
                aria-label="Exercise status"
            >
                <button
                    className={`min-h-11 rounded-[8px] px-4 text-xs font-extrabold tracking-[0.08em] uppercase transition ${view === "active" ? "bg-flame text-ink" : "text-dim hover:text-cream"}`}
                    type="button"
                    role="tab"
                    aria-selected={view === "active"}
                    onClick={() => changeView("active")}
                >
                    Active
                </button>
                <button
                    className={`min-h-11 rounded-[8px] px-4 text-xs font-extrabold tracking-[0.08em] uppercase transition ${view === "archived" ? "bg-flame text-ink" : "text-dim hover:text-cream"}`}
                    type="button"
                    role="tab"
                    aria-selected={view === "archived"}
                    onClick={() => changeView("archived")}
                >
                    Archived
                </button>
            </div>

            <div>
                <div className="mb-4 flex items-end justify-between">
                    <div>
                        <h2 className="section-title">Your exercises</h2>
                        <p className="section-caption">
                            {exerciseData.exercises.length} {view} movements
                        </p>
                    </div>
                </div>
                {exerciseData.exercises.length === 0 ? (
                    <Card className="py-14 text-center">
                        <p className="font-bold text-cream">
                            {view === "active"
                                ? "Your library is empty."
                                : "No archived exercises."}
                        </p>
                        <p className="mt-2 text-sm text-dim">
                            {view === "active"
                                ? "Add your first movement to start building workouts."
                                : "Exercises you archive will appear here."}
                        </p>
                        {view === "active" && (
                            <Button
                                className="mt-6 w-full sm:w-auto"
                                type="button"
                                onClick={() => {
                                    setEditingExercise(null);
                                    setIsFormOpen(true);
                                }}
                            >
                                <Icon name="plus" size={16} />
                                Add your first exercise
                            </Button>
                        )}
                    </Card>
                ) : (
                    <ExerciseList
                        exercises={exerciseData.exercises}
                        onArchive={handleArchiveExercise}
                        onEdit={handleEditExercise}
                        archivingExerciseId={exerciseData.archivingExerciseId}
                        isArchivedView={view === "archived"}
                        onRestore={handleRestoreExercise}
                    />
                )}
            </div>

            {isFormOpen && view === "active" && (
                <FormDialog
                    title={editingExercise ? "Edit exercise" : "Add exercise"}
                    description={
                        editingExercise
                            ? "Keep the movement consistent so workout history remains useful."
                            : "Use a clear name you will recognize immediately during a session."
                    }
                    onClose={handleCancelExercise}
                >
                    {editingExercise ? (
                        <UpdateExerciseForm
                            key={editingExercise.id}
                            exercise={editingExercise}
                            onSubmit={handleUpdateExercise}
                            onCancel={handleCancelExercise}
                        />
                    ) : (
                        <CreateExerciseForm onSubmit={handleCreateExercise} />
                    )}
                </FormDialog>
            )}
        </section>
    );
}
