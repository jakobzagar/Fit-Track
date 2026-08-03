import {useCallback, useEffect, useState} from "react";
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
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
} from "../../workout-exercises/schemas/workout.exercises.schemas.ts";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {LoadingState} from "../../../components/ui/LoadingState.tsx";
import {PageHeader} from "../../../components/ui/PageHeader.tsx";
import {Card} from "../../../components/ui/Card.tsx";
import {Link} from "react-router";
import {Button} from "../../../components/ui/Button.tsx";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog.ts";
import {WorkoutExerciseCard} from "../components/WorkoutExerciseCard.tsx";

export function WorkoutDetailPage() {
    const confirm = useConfirmDialog();
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

    const loadWorkout = useCallback(async () => {
        if (!workoutId) return;

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
    }, [workoutId]);

    useEffect(() => {
        let isCurrent = true;
        queueMicrotask(() => {
            if (isCurrent) void loadWorkout();
        });
        return () => {
            isCurrent = false;
        };
    }, [loadWorkout]);

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

        if (
            !(await confirm({
                title: "Remove exercise?",
                message: "This exercise and all of its sets will be removed from the workout.",
                confirmLabel: "Remove exercise",
                variant: "danger",
            }))
        )
            return;

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

        if (
            !(await confirm({
                title: "Delete set?",
                message: "This set will be permanently removed from the workout.",
                confirmLabel: "Delete set",
                variant: "danger",
            }))
        )
            return;

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
        if (!workoutId) return <Feedback>Workout ID is missing</Feedback>;
        return <LoadingState label="Loading workout" />;
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
                        void loadWorkout();
                    }}
                >
                    Try again
                </Button>
            </div>
        );
    }

    if (!workout) {
        return <Feedback>Workout not found</Feedback>;
    }

    return (
        <section className="page-stack">
            <PageHeader
                eyebrow={workout.status === "COMPLETED" ? "Completed session" : "Workout plan"}
                title={workout.name}
                description={`${new Date(workout.performedAt).toLocaleDateString(undefined, {day: "2-digit", month: "long", year: "numeric"})}${workout.notes ? ` · ${workout.notes}` : ""}`}
                action={
                    workout.status !== "COMPLETED" ? (
                        <Link
                            className="inline-flex min-h-11 items-center rounded-[10px] bg-flame px-4 text-xs font-extrabold tracking-[0.07em] text-ink uppercase"
                            to={`/workouts/${workout.id}/session`}
                        >
                            {workout.status === "ACTIVE" ? "Continue session" : "Start workout"}
                        </Link>
                    ) : undefined
                }
            />

            {mutationError && <Feedback>{mutationError}</Feedback>}

            <Card>
                <div className="mb-5">
                    <p className="eyebrow">Workout builder</p>
                    <h2 className="section-title mt-2">Add exercise</h2>
                </div>
                <AddExerciseToWorkoutForm
                    exercises={exercises.filter(
                        (exercise) =>
                            !workout.workoutExercises.some(
                                (workoutExercise) => workoutExercise.exerciseId === exercise.id,
                            ),
                    )}
                    onSubmit={handleAddExercise}
                />
            </Card>

            <div>
                <h2 className="section-title">Exercises</h2>
                <p className="section-caption">
                    {workout.workoutExercises.length} movements in this workout
                </p>
            </div>

            {workout.workoutExercises.length === 0 ? (
                <Card className="py-12 text-center text-sm text-dim">No exercises added yet.</Card>
            ) : (
                <section className="grid gap-4">
                    {workout.workoutExercises.map((workoutExercise) => (
                        <WorkoutExerciseCard
                            key={workoutExercise.id}
                            workoutExercise={workoutExercise}
                            editingWorkoutExercise={editingWorkoutExercise}
                            editingWorkoutSet={editingWorkoutSet}
                            deletingWorkoutExerciseId={deletingWorkoutExerciseId}
                            deletingWorkoutSetId={deletingWorkoutSetId}
                            onEditExercise={setEditingWorkoutExercise}
                            onUpdateExercise={handleUpdateWorkoutExercise}
                            onDeleteExercise={(id) => void handleDeleteWorkoutExercise(id)}
                            onEditSet={setEditingWorkoutSet}
                            onUpdateSet={handleUpdateWorkoutSet}
                            onDeleteSet={(workoutExerciseId, setId) =>
                                void handleDeleteWorkoutSet(workoutExerciseId, setId)
                            }
                            onAddSet={(data) => handleAddSet(workoutExercise.id, data)}
                        />
                    ))}
                </section>
            )}
        </section>
    );
}
