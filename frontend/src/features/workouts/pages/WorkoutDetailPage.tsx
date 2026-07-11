import {useEffect, useState} from "react";
import {useParams} from "react-router";

import {getWorkoutById} from "../api/workouts.api.ts";
import type {Workout} from "../workout.types.ts";
import {getExercises} from "../../exercises/api/exercises.api.ts";
import type {Exercise} from "../../exercises/exercise.types.ts";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
} from "../../workout-exercises/api/workout.exercises.api.ts";
import {AddExerciseToWorkoutForm} from "../../workout-exercises/components/AddExerciseToWorkoutForm.tsx";
import {AddWorkoutSetForm} from "../../workout-exercises/components/AddWorkoutSetForm.tsx";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
} from "../../workout-exercises/schemas/workout.exercises.schemas.ts";

export function WorkoutDetailPage() {
    const {workoutId} = useParams();

    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
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

                            {workoutExercise.sets.length === 0 ? (
                                <p>No sets added yet</p>
                            ) : (
                                <ul>
                                    {workoutExercise.sets.map((set) => (
                                        <li key={set.id}>
                                            Set {set.setNumber}:{" "}
                                            {set.reps !== null && `${set.reps} reps`}
                                            {set.reps !== null && set.weight !== null && ", "}
                                            {set.weight !== null && `${set.weight} kg`}
                                            {(set.reps !== null || set.weight !== null) &&
                                                set.durationSeconds !== null &&
                                                ", "}
                                            {set.durationSeconds !== null &&
                                                `${set.durationSeconds} seconds`}
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
