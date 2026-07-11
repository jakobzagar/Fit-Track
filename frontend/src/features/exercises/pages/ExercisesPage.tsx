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

export function ExercisesPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [archivingExerciseId, setArchivingExerciseId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");

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

        try {
            const response: ExerciseResponse = await createExercise(data);
            setExercises((currentExercises) => [...currentExercises, response.exercise]);
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to create exercise");
            throw error;
        }
    }

    async function handleArchiveExercise(exerciseId: string) {
        setMutationError("");
        setArchivingExerciseId(exerciseId);

        try {
            await archiveExercise(exerciseId);

            setExercises((currentExercises) =>
                currentExercises.filter((exercise) => exercise.id !== exerciseId),
            );
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

        try {
            const response = await updateExercise(editingExercise.id, data);

            setExercises((currentExercises) =>
                currentExercises.map((exercise) =>
                    exercise.id === response.exercise.id ? response.exercise : exercise,
                ),
            );

            setEditingExercise(null);
        } catch (error) {
            setMutationError(error instanceof Error ? error.message : "Failed to update exercise");
            throw error;
        }
    }

    if (isLoading) {
        return <p>Loading exercises...</p>;
    }

    if (loadError) {
        return <p>{loadError}</p>;
    }

    return (
        <section>
            <h1>Exercises</h1>

            {mutationError && <p>{mutationError}</p>}

            {exercises.length === 0 ? (
                <p>No exercises found</p>
            ) : (
                <ExerciseList
                    exercises={exercises}
                    onArchive={handleArchiveExercise}
                    onEdit={handleEditExercise}
                    archivingExerciseId={archivingExerciseId}
                />
            )}

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
        </section>
    );
}
