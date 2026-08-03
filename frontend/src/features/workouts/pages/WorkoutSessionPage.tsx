import {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router";
import type {Exercise} from "../../exercises/exercise.types.ts";
import {getExercises} from "../../exercises/api/exercises.api.ts";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
    setWorkoutSetCompletion,
    updateWorkoutSet,
} from "../../workout-exercises/api/workout.exercises.api.ts";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutSetInput,
} from "../../workout-exercises/schemas/workout.exercises.schemas.ts";
import {
    finishWorkout,
    getPreviousPerformances,
    getWorkoutById,
    startWorkout,
} from "../api/workouts.api.ts";
import type {PreviousPerformance, Workout, WorkoutSet} from "../workout.types.ts";
import {AddExerciseToWorkoutForm} from "../../workout-exercises/components/AddExerciseToWorkoutForm.tsx";
import {Button} from "../../../components/ui/Button.tsx";
import {Card} from "../../../components/ui/Card.tsx";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {LoadingState} from "../../../components/ui/LoadingState.tsx";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog.ts";
import {WorkoutSessionHeader} from "../components/WorkoutSessionHeader.tsx";
import {WorkoutSessionExerciseCard} from "../components/WorkoutSessionExerciseCard.tsx";
import {WorkoutSessionActionBar} from "../components/WorkoutSessionActionBar.tsx";
import {useUnsavedSessionGuard} from "../hooks/useUnsavedSessionGuard.ts";

export function WorkoutSessionPage() {
    const confirm = useConfirmDialog();
    const {workoutId} = useParams();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [previousPerformances, setPreviousPerformances] = useState<PreviousPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinishing, setIsFinishing] = useState(false);
    const [copyingExerciseId, setCopyingExerciseId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [dirtySetIds, setDirtySetIds] = useState<Set<string>>(() => new Set());
    useUnsavedSessionGuard({dirtySetCount: dirtySetIds.size, isFinishing, confirm});

    const loadSession = useCallback(async () => {
        if (!workoutId) return;

        try {
            const [workoutResponse, exercisesResponse, performancesResponse] = await Promise.all([
                getWorkoutById(workoutId),
                getExercises(),
                getPreviousPerformances(workoutId),
            ]);

            let loadedWorkout = workoutResponse.workout;

            if (loadedWorkout.status === "COMPLETED") {
                void navigate(`/workouts/${workoutId}`, {replace: true});
                return;
            }

            if (loadedWorkout.status === "DRAFT") {
                const startResponse = await startWorkout(workoutId);
                loadedWorkout = {...loadedWorkout, ...startResponse.workout};
            }

            setWorkout(loadedWorkout);
            setExercises(exercisesResponse.exercises);
            setPreviousPerformances(performancesResponse.previousPerformances);
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Failed to load session");
        } finally {
            setIsLoading(false);
        }
    }, [navigate, workoutId]);

    useEffect(() => {
        let isCurrent = true;
        queueMicrotask(() => {
            if (isCurrent) void loadSession();
        });
        return () => {
            isCurrent = false;
        };
    }, [loadSession]);

    const handleDirtyChange = useCallback((setId: string, isDirty: boolean) => {
        setDirtySetIds((current) => {
            const next = new Set(current);
            if (isDirty) next.add(setId);
            else next.delete(setId);
            return next;
        });
    }, []);

    const previousByExerciseId = useMemo(
        () =>
            new Map(
                previousPerformances.map((performance) => [performance.exerciseId, performance]),
            ),
        [previousPerformances],
    );

    function replaceSet(workoutExerciseId: string, nextSet: WorkoutSet) {
        setWorkout((current) =>
            current
                ? {
                      ...current,
                      workoutExercises: current.workoutExercises.map((workoutExercise) =>
                          workoutExercise.id === workoutExerciseId
                              ? {
                                    ...workoutExercise,
                                    sets: workoutExercise.sets.map((workoutSet) =>
                                        workoutSet.id === nextSet.id ? nextSet : workoutSet,
                                    ),
                                }
                              : workoutExercise,
                      ),
                  }
                : null,
        );
    }

    async function handleAddExercise(data: AddExerciseToWorkoutInput) {
        if (!workoutId) return;
        setError("");

        const response = await addExerciseToWorkout(workoutId, data);
        setWorkout((current) =>
            current
                ? {
                      ...current,
                      workoutExercises: [
                          ...current.workoutExercises,
                          {...response.workoutExercise, sets: []},
                      ],
                  }
                : null,
        );

        const performancesResponse = await getPreviousPerformances(workoutId);
        setPreviousPerformances(performancesResponse.previousPerformances);
    }

    async function handleAddSet(workoutExerciseId: string, data: CreateWorkoutSetInput) {
        if (!workoutId) return;
        setError("");
        const response = await addSetToWorkoutExercise(workoutId, workoutExerciseId, data);

        setWorkout((current) =>
            current
                ? {
                      ...current,
                      workoutExercises: current.workoutExercises.map((workoutExercise) =>
                          workoutExercise.id === workoutExerciseId
                              ? {
                                    ...workoutExercise,
                                    sets: [...workoutExercise.sets, response.workoutExerciseSet],
                                }
                              : workoutExercise,
                      ),
                  }
                : null,
        );
    }

    async function handleCopyLastSet(workoutExerciseId: string, lastSet: WorkoutSet) {
        setCopyingExerciseId(workoutExerciseId);
        try {
            await handleAddSet(workoutExerciseId, {
                ...(lastSet.reps !== null && {reps: lastSet.reps}),
                ...(lastSet.weight !== null && {weight: lastSet.weight}),
                ...(lastSet.durationSeconds !== null && {
                    durationSeconds: lastSet.durationSeconds,
                }),
            });
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Failed to copy set");
        } finally {
            setCopyingExerciseId(null);
        }
    }

    async function handleSaveSet(
        workoutExerciseId: string,
        setId: string,
        data: UpdateWorkoutSetInput,
    ) {
        if (!workoutId) return;
        const response = await updateWorkoutSet(workoutId, workoutExerciseId, setId, data);
        replaceSet(workoutExerciseId, response.workoutExerciseSet);
    }

    async function handleToggleSet(
        workoutExerciseId: string,
        setId: string,
        completed: boolean,
        data: UpdateWorkoutSetInput,
    ) {
        if (!workoutId) return;

        const completionResponse = await setWorkoutSetCompletion(
            workoutId,
            workoutExerciseId,
            setId,
            {...data, completed},
        );
        replaceSet(workoutExerciseId, completionResponse.workoutExerciseSet);
    }

    async function handleFinish() {
        if (!workoutId) return;
        setError("");

        if (dirtySetIds.size > 0) {
            setError(
                `Save or complete ${dirtySetIds.size === 1 ? "the edited set" : `all ${dirtySetIds.size} edited sets`} before finishing the workout.`,
            );
            return;
        }

        setIsFinishing(true);

        try {
            await finishWorkout(workoutId);
            void navigate(`/workouts/${workoutId}`, {replace: true});
        } catch (caughtError) {
            setError(
                caughtError instanceof Error ? caughtError.message : "Failed to finish workout",
            );
            setIsFinishing(false);
        }
    }

    function handleExit() {
        if (dirtySetIds.size > 0) {
            void navigate(`/workouts/${workout?.id}`);
            return;
        }
        void confirm({
            title: "Leave active workout?",
            message: "Your saved sets will remain and you can continue this session later.",
            confirmLabel: "Leave session",
        }).then((confirmed) => {
            if (confirmed && workout) void navigate(`/workouts/${workout.id}`);
        });
    }

    if (isLoading) {
        if (!workoutId) return <Feedback>Workout ID is missing</Feedback>;
        return <LoadingState label="Starting workout" />;
    }
    if (error && !workout) {
        return (
            <div className="page-stack">
                <Feedback>{error}</Feedback>
                <Button
                    className="w-fit"
                    variant="secondary"
                    onClick={() => {
                        setIsLoading(true);
                        setError("");
                        void loadSession();
                    }}
                >
                    Try again
                </Button>
            </div>
        );
    }
    if (!workout) return null;

    const completedSetCount = workout.workoutExercises.reduce(
        (count, workoutExercise) =>
            count +
            workoutExercise.sets.filter((workoutSet) => workoutSet.completedAt !== null).length,
        0,
    );

    return (
        <section className="mx-auto max-w-4xl space-y-6">
            <WorkoutSessionHeader
                workout={workout}
                completedSetCount={completedSetCount}
                onExit={handleExit}
            />

            {error && <Feedback>{error}</Feedback>}

            <Card>
                <div className="mb-5">
                    <p className="eyebrow">Build session</p>
                    <h2 className="section-title mt-2">Add an exercise</h2>
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

            {workout.workoutExercises.length === 0 && (
                <Card className="py-12 text-center">
                    <p className="font-bold text-cream">This session needs a movement.</p>
                    <p className="mt-2 text-sm text-dim">
                        Add an exercise above, then log your first set.
                    </p>
                </Card>
            )}

            {workout.workoutExercises.map((workoutExercise) => (
                <WorkoutSessionExerciseCard
                    key={workoutExercise.id}
                    workoutExercise={workoutExercise}
                    previous={previousByExerciseId.get(workoutExercise.exerciseId)}
                    disabled={workout.status !== "ACTIVE"}
                    isCopying={copyingExerciseId === workoutExercise.id}
                    onAddSet={(data) => handleAddSet(workoutExercise.id, data)}
                    onCopyLastSet={(lastSet) => void handleCopyLastSet(workoutExercise.id, lastSet)}
                    onSaveSet={(setId, data) => handleSaveSet(workoutExercise.id, setId, data)}
                    onToggleSet={(setId, completed, data) =>
                        handleToggleSet(workoutExercise.id, setId, completed, data)
                    }
                    onDirtyChange={handleDirtyChange}
                />
            ))}

            <WorkoutSessionActionBar
                completedSetCount={completedSetCount}
                isFinishing={isFinishing}
                onFinish={() => void handleFinish()}
            />
        </section>
    );
}
