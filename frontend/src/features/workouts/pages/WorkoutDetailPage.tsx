import {useEffect, useState} from "react";
import {useParams} from "react-router";

import {getWorkoutById} from "../api/workouts.api.ts";
import type {Workout, WorkoutExercise, WorkoutSet} from "../workout.types.ts";
import {getExercises} from "../../exercises/api/exercises.api.ts";
import type {Exercise} from "../../exercises/exercise.types.ts";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
    deleteWorkoutExercise,
    deleteWorkoutSet,
    updateWorkoutExercise,
    updateWorkoutSet,
} from "../../workout-exercises/api/workout.exercises.api.ts";
import {AddExerciseToWorkoutForm} from "../../workout-exercises/components/AddExerciseToWorkoutForm.tsx";
import {AddWorkoutSetForm} from "../../workout-exercises/components/AddWorkoutSetForm.tsx";
import {UpdateWorkoutExerciseForm} from "../../workout-exercises/components/UpdateWorkoutExerciseForm.tsx";
import {UpdateWorkoutSetForm} from "../../workout-exercises/components/UpdateWorkoutSetForm.tsx";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
} from "../../workout-exercises/schemas/workout.exercises.schemas.ts";

export function WorkoutDetailPage() {
    const {workoutId} = useParams();

    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [editingWorkoutExercise, setEditingWorkoutExercise] = useState<WorkoutExercise | null>(
        null,
    );
    const [editingWorkoutSet, setEditingWorkoutSet] = useState<WorkoutSet | null>(null);
    const [deletingWorkoutExerciseId, setDeletingWorkoutExerciseId] = useState<string | null>(null);
    const [deletingWorkoutSetId, setDeletingWorkoutSetId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [mutationError, setMutationError] = useState("");

    useEffect(() => {
        async function loadWorkout() {
            if (!workoutId) {
                setLoadError("Workout ID is missing");
                setIsLoading(false);
                return;
            }

            try {
                const [workoutResponse, exercisesResponse] = await Promise.all([
                    getWorkoutById(workoutId),
                    getExercises(),
                ]);

                setWorkout(workoutResponse.workout);
                setExercises(exercisesResponse.exercises);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : "Failed to load workout");
            } finally {
                setIsLoading(false);
            }
        }

        void loadWorkout();
    }, [workoutId]);

    async function handleAddExercise(data: AddExerciseToWorkoutInput) {
        if (!workoutId) {
            throw new Error("Workout ID is missing");
        }

        setMutationError("");

        try {
            const response = await addExerciseToWorkout(workoutId, data);

            setWorkout((currentWorkout) =>
                currentWorkout
                    ? {
                          ...currentWorkout,
                          workoutExercises: [
                              ...currentWorkout.workoutExercises,
                              {
                                  ...response.workoutExercise,
                                  sets: [],
                              },
                          ],
                      }
                    : null,
            );
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to add exercise to workout",
            );
            throw error;
        }
    }

    async function handleAddSet(workoutExerciseId: string, data: CreateWorkoutSetInput) {
        if (!workoutId) {
            throw new Error("Workout ID is missing");
        }

        setMutationError("");

        try {
            const response = await addSetToWorkoutExercise(workoutId, workoutExerciseId, data);

            setWorkout((currentWorkout) =>
                currentWorkout
                    ? {
                          ...currentWorkout,
                          workoutExercises: currentWorkout.workoutExercises.map(
                              (workoutExercise) =>
                                  workoutExercise.id === workoutExerciseId
                                      ? {
                                            ...workoutExercise,
                                            sets: [
                                                ...workoutExercise.sets,
                                                response.workoutExerciseSet,
                                            ],
                                        }
                                      : workoutExercise,
                          ),
                      }
                    : null,
            );
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to add set to workout exercise",
            );
            throw error;
        }
    }

    async function handleUpdateWorkoutExercise(data: UpdateWorkoutExerciseInput) {
        if (!workoutId || !editingWorkoutExercise) {
            throw new Error("Workout exercise is not selected");
        }

        setMutationError("");

        try {
            const previousPosition = editingWorkoutExercise.position;
            const response = await updateWorkoutExercise(
                workoutId,
                editingWorkoutExercise.id,
                data,
            );
            const nextPosition = response.workoutExercise.position;

            setWorkout((currentWorkout) =>
                currentWorkout
                    ? {
                          ...currentWorkout,
                          workoutExercises: currentWorkout.workoutExercises
                              .map((workoutExercise) => {
                                  if (workoutExercise.id === editingWorkoutExercise.id) {
                                      return response.workoutExercise;
                                  }

                                  if (
                                      nextPosition < previousPosition &&
                                      workoutExercise.position >= nextPosition &&
                                      workoutExercise.position < previousPosition
                                  ) {
                                      return {
                                          ...workoutExercise,
                                          position: workoutExercise.position + 1,
                                      };
                                  }

                                  if (
                                      nextPosition > previousPosition &&
                                      workoutExercise.position > previousPosition &&
                                      workoutExercise.position <= nextPosition
                                  ) {
                                      return {
                                          ...workoutExercise,
                                          position: workoutExercise.position - 1,
                                      };
                                  }

                                  return workoutExercise;
                              })
                              .sort((first, second) => first.position - second.position),
                      }
                    : null,
            );

            setEditingWorkoutExercise(null);
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to update workout exercise",
            );
            throw error;
        }
    }

    async function handleDeleteWorkoutExercise(workoutExerciseId: string) {
        if (!workoutId) {
            return;
        }

        setMutationError("");
        setDeletingWorkoutExerciseId(workoutExerciseId);

        try {
            await deleteWorkoutExercise(workoutId, workoutExerciseId);

            setWorkout((currentWorkout) =>
                currentWorkout
                    ? {
                          ...currentWorkout,
                          workoutExercises: currentWorkout.workoutExercises
                              .filter((workoutExercise) => workoutExercise.id !== workoutExerciseId)
                              .map((workoutExercise, index) => ({
                                  ...workoutExercise,
                                  position: index + 1,
                              })),
                      }
                    : null,
            );
            setEditingWorkoutExercise(null);
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to delete workout exercise",
            );
        } finally {
            setDeletingWorkoutExerciseId(null);
        }
    }

    async function handleUpdateWorkoutSet(data: UpdateWorkoutSetInput) {
        if (!workoutId || !editingWorkoutSet) {
            throw new Error("Workout set is not selected");
        }

        setMutationError("");

        try {
            const response = await updateWorkoutSet(
                workoutId,
                editingWorkoutSet.workoutExerciseId,
                editingWorkoutSet.id,
                data,
            );

            setWorkout((currentWorkout) =>
                currentWorkout
                    ? {
                          ...currentWorkout,
                          workoutExercises: currentWorkout.workoutExercises.map(
                              (workoutExercise) => ({
                                  ...workoutExercise,
                                  sets: workoutExercise.sets.map((workoutSet) =>
                                      workoutSet.id === editingWorkoutSet.id
                                          ? response.workoutExerciseSet
                                          : workoutSet,
                                  ),
                              }),
                          ),
                      }
                    : null,
            );

            setEditingWorkoutSet(null);
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to update workout set",
            );
            throw error;
        }
    }

    async function handleDeleteWorkoutSet(workoutExerciseId: string, setId: string) {
        if (!workoutId) {
            return;
        }

        setMutationError("");
        setDeletingWorkoutSetId(setId);

        try {
            await deleteWorkoutSet(workoutId, workoutExerciseId, setId);

            setWorkout((currentWorkout) =>
                currentWorkout
                    ? {
                          ...currentWorkout,
                          workoutExercises: currentWorkout.workoutExercises.map(
                              (workoutExercise) =>
                                  workoutExercise.id === workoutExerciseId
                                      ? {
                                            ...workoutExercise,
                                            sets: workoutExercise.sets
                                                .filter((workoutSet) => workoutSet.id !== setId)
                                                .map((workoutSet, index) => ({
                                                    ...workoutSet,
                                                    setNumber: index + 1,
                                                })),
                                        }
                                      : workoutExercise,
                          ),
                      }
                    : null,
            );
            setEditingWorkoutSet(null);
        } catch (error) {
            setMutationError(
                error instanceof Error ? error.message : "Failed to delete workout set",
            );
        } finally {
            setDeletingWorkoutSetId(null);
        }
    }

    if (isLoading) {
        return <p>Loading workout...</p>;
    }

    if (loadError) {
        return <p>{loadError}</p>;
    }

    if (!workout) {
        return <p>Workout not found</p>;
    }

    return (
        <section>
            <h1>{workout.name}</h1>

            <p>Date: {new Date(workout.performedAt).toLocaleDateString()}</p>

            {workout.notes && <p>{workout.notes}</p>}

            {mutationError && <p>{mutationError}</p>}

            <AddExerciseToWorkoutForm
                exercises={exercises.filter(
                    (exercise) =>
                        !workout.workoutExercises.some(
                            (workoutExercise) => workoutExercise.exerciseId === exercise.id,
                        ),
                )}
                onSubmit={handleAddExercise}
            />

            <h2>Exercises</h2>

            {workout.workoutExercises.length === 0 ? (
                <p>No exercises added yet</p>
            ) : (
                <section>
                    {workout.workoutExercises.map((workoutExercise) => (
                        <article key={workoutExercise.id}>
                            <h3>{workoutExercise.exercise.name}</h3>

                            <p>{workoutExercise.exercise.muscleGroup}</p>

                            {workoutExercise.notes && <p>{workoutExercise.notes}</p>}

                            {editingWorkoutExercise?.id === workoutExercise.id ? (
                                <UpdateWorkoutExerciseForm
                                    workoutExercise={editingWorkoutExercise}
                                    onSubmit={handleUpdateWorkoutExercise}
                                    onCancel={() => setEditingWorkoutExercise(null)}
                                />
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        disabled={deletingWorkoutExerciseId === workoutExercise.id}
                                        onClick={() => setEditingWorkoutExercise(workoutExercise)}
                                    >
                                        Edit exercise
                                    </button>
                                    <button
                                        type="button"
                                        disabled={deletingWorkoutExerciseId === workoutExercise.id}
                                        onClick={() =>
                                            handleDeleteWorkoutExercise(workoutExercise.id)
                                        }
                                    >
                                        {deletingWorkoutExerciseId === workoutExercise.id
                                            ? "Deleting..."
                                            : "Delete exercise"}
                                    </button>
                                </>
                            )}

                            {workoutExercise.sets.length === 0 ? (
                                <p>No sets added yet</p>
                            ) : (
                                <ul>
                                    {workoutExercise.sets.map((set) => (
                                        <li key={set.id}>
                                            {editingWorkoutSet?.id === set.id ? (
                                                <UpdateWorkoutSetForm
                                                    workoutSet={editingWorkoutSet}
                                                    onSubmit={handleUpdateWorkoutSet}
                                                    onCancel={() => setEditingWorkoutSet(null)}
                                                />
                                            ) : (
                                                <>
                                                    Set {set.setNumber}:{" "}
                                                    {set.reps !== null && `${set.reps} reps`}
                                                    {set.reps !== null &&
                                                        set.weight !== null &&
                                                        ", "}
                                                    {set.weight !== null && `${set.weight} kg`}
                                                    {(set.reps !== null || set.weight !== null) &&
                                                        set.durationSeconds !== null &&
                                                        ", "}
                                                    {set.durationSeconds !== null &&
                                                        `${set.durationSeconds} seconds`}
                                                    <button
                                                        type="button"
                                                        disabled={deletingWorkoutSetId === set.id}
                                                        onClick={() => setEditingWorkoutSet(set)}
                                                    >
                                                        Edit set
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={deletingWorkoutSetId === set.id}
                                                        onClick={() =>
                                                            handleDeleteWorkoutSet(
                                                                workoutExercise.id,
                                                                set.id,
                                                            )
                                                        }
                                                    >
                                                        {deletingWorkoutSetId === set.id
                                                            ? "Deleting..."
                                                            : "Delete set"}
                                                    </button>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <AddWorkoutSetForm
                                onSubmit={(data) => handleAddSet(workoutExercise.id, data)}
                            />
                        </article>
                    ))}
                </section>
            )}
        </section>
    );
}
