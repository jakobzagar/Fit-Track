import {useCallback, useEffect, useState} from "react";
import {ExerciseList} from "../components/ExerciseList.tsx";
import {
    createExercise,
    getExercises,
    archiveExercise,
    updateExercise,
    restoreExercise,
} from "../api/exercises.api.ts";
import type {ExercisesResponse, Exercise, ExerciseResponse} from "../exercise.types.ts";
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

export function ExercisesPage() {
    const confirm = useConfirmDialog();
    const [view, setView] = useState<"active" | "archived">("active");
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [archivingExerciseId, setArchivingExerciseId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);

    const loadExercises = useCallback(async () => {
        try {
            const response: ExercisesResponse = await getExercises(view);
            setExercises(response.exercises);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load exercises");
        } finally {
            setIsLoading(false);
        }
    }, [view]);

    useEffect((): void => {
        async function loadInitialExercises() {
            try {
                const response: ExercisesResponse = await getExercises(view);
                setExercises(response.exercises);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load exercises");
            } finally {
                setIsLoading(false);
            }
        }

        void loadInitialExercises();
    }, [view]);

    function changeView(nextView: "active" | "archived") {
        if (nextView === view) return;
        setView(nextView);
        setExercises([]);
        setEditingExercise(null);
        setLoadError("");
        setMutationError("");
        setSuccessMessage("");
        setIsLoading(true);
    }

    async function handleCreateExercise(data: CreateExerciseInput) {
        setMutationError("");
        setSuccessMessage("");

        try {
            const response: ExerciseResponse = await createExercise(data);
            setExercises((currentExercises) => [...currentExercises, response.exercise]);
            setSuccessMessage("Exercise created successfully.");
            setIsFormOpen(false);
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create exercise");
            throw error;
        }
    }

    async function handleArchiveExercise(exerciseId: string) {
        const exercise = exercises.find((item) => item.id === exerciseId);
        if (
            !(await confirm({
                title: "Archive exercise?",
                message: `${exercise?.name ?? "This exercise"} will move to your archive and can be restored later.`,
                confirmLabel: "Archive",
            }))
        )
            return;

        setMutationError("");
        setSuccessMessage("");
        setArchivingExerciseId(exerciseId);

        try {
            await archiveExercise(exerciseId);

            setExercises((currentExercises) =>
                currentExercises.filter((exercise) => exercise.id !== exerciseId),
            );
            setSuccessMessage("Exercise archived.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to archive exercise");
        } finally {
            setArchivingExerciseId(null);
        }
    }

    async function handleRestoreExercise(exerciseId: string) {
        const exercise = exercises.find((item) => item.id === exerciseId);
        if (
            !(await confirm({
                title: "Restore exercise?",
                message: `${exercise?.name ?? "This exercise"} will return to your active exercise library.`,
                confirmLabel: "Restore",
            }))
        )
            return;

        setMutationError("");
        setSuccessMessage("");
        setArchivingExerciseId(exerciseId);

        try {
            await restoreExercise(exerciseId);
            setExercises((current) => current.filter((item) => item.id !== exerciseId));
            setSuccessMessage("Exercise restored to your active library.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to restore exercise");
        } finally {
            setArchivingExerciseId(null);
        }
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

        setMutationError("");
        setSuccessMessage("");

        try {
            const response = await updateExercise(editingExercise.id, data);

            setExercises((currentExercises) =>
                currentExercises.map((exercise) =>
                    exercise.id === response.exercise.id ? response.exercise : exercise,
                ),
            );

            setEditingExercise(null);
            setIsFormOpen(false);
            setSuccessMessage("Exercise updated successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to update exercise");
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
                        void loadExercises();
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
            {mutationError && <Feedback>{mutationError}</Feedback>}
            {successMessage && (
                <Feedback tone="success" onDismiss={() => setSuccessMessage("")}>
                    {successMessage}
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
                            {exercises.length} {view} movements
                        </p>
                    </div>
                </div>
                {exercises.length === 0 ? (
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
                    </Card>
                ) : (
                    <ExerciseList
                        exercises={exercises}
                        onArchive={handleArchiveExercise}
                        onEdit={handleEditExercise}
                        archivingExerciseId={archivingExerciseId}
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
