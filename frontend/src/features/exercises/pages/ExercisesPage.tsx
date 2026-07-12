import {useEffect, useState} from "react";
import {ExerciseList} from "../components/ExerciseList.tsx";
import {
    createExercise,
    getExercises,
    archiveExercise,
    updateExercise,
} from "../api/exercises.api.ts";
import type {ExercisesResponse, Exercise, ExerciseResponse} from "../exercise.types.ts";
import type {CreateExerciseInput, UpdateExerciseInput} from "../schemas/exercise.schemas.ts";
import {CreateExerciseForm} from "../components/CreateExerciseForm.tsx";
import {UpdateExerciseForm} from "../components/UpdateExerciseForm.tsx";
import {Card} from "../../../components/ui/Card.tsx";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {PageHeader} from "../../../components/ui/PageHeader.tsx";
import {SkeletonGrid} from "../../../components/ui/SkeletonGrid.tsx";

export function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [archivingExerciseId, setArchivingExerciseId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect((): void => {
        async function loadExercises() {
            try {
                const response: ExercisesResponse = await getExercises();
                setExercises(response.exercises);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load exercises");
            } finally {
                setIsLoading(false);
            }
        }

        void loadExercises();
    }, []);

    async function handleCreateExercise(data: CreateExerciseInput) {
        setMutationError("");
        setSuccessMessage("");

        try {
            const response: ExerciseResponse = await createExercise(data);
            setExercises((currentExercises) => [...currentExercises, response.exercise]);
            setSuccessMessage("Exercise created successfully.");
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create exercise");
            throw error;
        }
    }

    async function handleArchiveExercise(exerciseId: string) {
        const exercise = exercises.find((item) => item.id === exerciseId);
        if (!window.confirm(`Archive ${exercise?.name ?? "this exercise"}?`)) return;

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

    function handleEditExercise(exercise: Exercise) {
        setEditingExercise(exercise);
    }

    async function handleCancelExercise() {
        setEditingExercise(null);
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
        return <Feedback>{loadError}</Feedback>;
    }

    return (
        <section className="page-stack">
            <PageHeader
                eyebrow="Exercise library"
                title="Movements"
                description="Build a clean library of the movements you train. Keep names consistent so your history stays useful."
            />
            {mutationError && <Feedback>{mutationError}</Feedback>}
            {successMessage && <Feedback tone="success">{successMessage}</Feedback>}

            <div className="content-grid">
                <div>
                    <div className="mb-4 flex items-end justify-between">
                        <div>
                            <h2 className="section-title">Your exercises</h2>
                            <p className="section-caption">{exercises.length} active movements</p>
                        </div>
                    </div>
                    {exercises.length === 0 ? (
                        <Card className="py-14 text-center">
                            <p className="font-bold text-cream">Your library is empty.</p>
                            <p className="mt-2 text-sm text-dim">
                                Add your first movement to start building workouts.
                            </p>
                        </Card>
                    ) : (
                        <ExerciseList
                            exercises={exercises}
                            onArchive={handleArchiveExercise}
                            onEdit={handleEditExercise}
                            archivingExerciseId={archivingExerciseId}
                        />
                    )}
                </div>
                <Card as="aside" className="sticky top-24">
                    {editingExercise ? (
                        <UpdateExerciseForm
                            key={editingExercise.id}
                            exercise={editingExercise}
                            onSubmit={handleUpdateExercise}
                            onCancel={handleCancelExercise}
                        />
                    ) : (
                        <>
                            <div className="mb-6">
                                <p className="eyebrow">New movement</p>
                                <h2 className="section-title mt-2">Add exercise</h2>
                                <p className="section-caption">
                                    Use a clear, familiar name you will recognize mid-workout.
                                </p>
                            </div>
                            <CreateExerciseForm onSubmit={handleCreateExercise} />
                        </>
                    )}
                </Card>
            </div>
        </section>
    );
}
