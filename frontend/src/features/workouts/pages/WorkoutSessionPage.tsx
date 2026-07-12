import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate, useParams} from "react-router";
import type {Exercise} from "../../exercises/exercise.types.ts";
import {getExercises} from "../../exercises/api/exercises.api.ts";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
    setWorkoutSetCompletion,
    updateWorkoutSet,
} from "../../workout-exercises/api/workout.exercises.api.ts";
import {AddExerciseToWorkoutForm} from "../../workout-exercises/components/AddExerciseToWorkoutForm.tsx";
import {NewWorkoutSetInlineRow} from "../../workout-exercises/components/NewWorkoutSetInlineRow.tsx";
import {WorkoutSetInlineRow} from "../../workout-exercises/components/WorkoutSetInlineRow.tsx";
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

export function WorkoutSessionPage() {
    const {workoutId} = useParams();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [previousPerformances, setPreviousPerformances] = useState<PreviousPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinishing, setIsFinishing] = useState(false);
    const [copyingExerciseId, setCopyingExerciseId] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadSession() {
            if (!workoutId) {
                setError("Workout ID is missing");
                setIsLoading(false);
                return;
            }

            try {
                const [workoutResponse, exercisesResponse, performancesResponse] =
                    await Promise.all([
                        getWorkoutById(workoutId),
                        getExercises(),
                        getPreviousPerformances(workoutId),
                    ]);

                let loadedWorkout = workoutResponse.workout;

                if (loadedWorkout.status === "COMPLETED") {
                    navigate(`/workouts/${workoutId}`, {replace: true});
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
                setError(
                    caughtError instanceof Error ? caughtError.message : "Failed to load session",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadSession();
    }, [navigate, workoutId]);

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

        const updateResponse = await updateWorkoutSet(workoutId, workoutExerciseId, setId, data);
        replaceSet(workoutExerciseId, updateResponse.workoutExerciseSet);

        const completionResponse = await setWorkoutSetCompletion(
            workoutId,
            workoutExerciseId,
            setId,
            {completed},
        );
        replaceSet(workoutExerciseId, completionResponse.workoutExerciseSet);
    }

    async function handleFinish() {
        if (!workoutId) return;
        setError("");
        setIsFinishing(true);

        try {
            await finishWorkout(workoutId);
            navigate(`/workouts/${workoutId}`, {replace: true});
        } catch (caughtError) {
            setError(
                caughtError instanceof Error ? caughtError.message : "Failed to finish workout",
            );
            setIsFinishing(false);
        }
    }

    if (isLoading) return <p>Starting workout...</p>;
    if (error && !workout) return <p>{error}</p>;
    if (!workout) return null;

    const completedSetCount = workout.workoutExercises.reduce(
        (count, workoutExercise) =>
            count +
            workoutExercise.sets.filter((workoutSet) => workoutSet.completedAt !== null).length,
        0,
    );

    return (
        <section className="mx-auto max-w-4xl space-y-6 p-4">
            <header className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-600">Active workout</p>
                    <h1 className="text-2xl font-bold">{workout.name}</h1>
                </div>
                <Link className="underline" to={`/workouts/${workout.id}`}>
                    Exit session
                </Link>
            </header>

            {error && <p className="rounded bg-red-100 p-3 text-red-800">{error}</p>}

            <AddExerciseToWorkoutForm
                exercises={exercises.filter(
                    (exercise) =>
                        !workout.workoutExercises.some(
                            (workoutExercise) => workoutExercise.exerciseId === exercise.id,
                        ),
                )}
                onSubmit={handleAddExercise}
            />

            {workout.workoutExercises.map((workoutExercise) => {
                const previous = previousByExerciseId.get(workoutExercise.exerciseId);
                const lastSet = workoutExercise.sets.at(-1);

                return (
                    <article className="space-y-3 rounded-xl border p-4" key={workoutExercise.id}>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {workoutExercise.exercise.name}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {workoutExercise.exercise.muscleGroup}
                            </p>
                        </div>

                        {previous ? (
                            <div className="rounded bg-gray-100 p-3 text-sm">
                                <strong>
                                    Previous ({new Date(previous.performedAt).toLocaleDateString()}
                                    ):
                                </strong>{" "}
                                {previous.sets
                                    .map((set) => `${set.weight ?? "–"} kg × ${set.reps ?? "–"}`)
                                    .join(" · ")}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No previous performance</p>
                        )}

                        <div className="space-y-2">
                            {workoutExercise.sets.map((workoutSet) => (
                                <WorkoutSetInlineRow
                                    key={workoutSet.id}
                                    workoutSet={workoutSet}
                                    disabled={workout.status !== "ACTIVE"}
                                    onSave={(data) =>
                                        handleSaveSet(workoutExercise.id, workoutSet.id, data)
                                    }
                                    onToggleCompletion={(completed, data) =>
                                        handleToggleSet(
                                            workoutExercise.id,
                                            workoutSet.id,
                                            completed,
                                            data,
                                        )
                                    }
                                />
                            ))}
                        </div>

                        <NewWorkoutSetInlineRow
                            setNumber={workoutExercise.sets.length + 1}
                            onSubmit={(data) => handleAddSet(workoutExercise.id, data)}
                        />

                        {lastSet && (
                            <button
                                className="rounded border px-3 py-2 text-sm"
                                type="button"
                                disabled={copyingExerciseId === workoutExercise.id}
                                onClick={() => void handleCopyLastSet(workoutExercise.id, lastSet)}
                            >
                                {copyingExerciseId === workoutExercise.id
                                    ? "Copying..."
                                    : "Copy last set"}
                            </button>
                        )}
                    </article>
                );
            })}

            <footer className="sticky bottom-0 flex items-center justify-between rounded-xl border bg-white p-4 shadow">
                <span>{completedSetCount} completed sets</span>
                <button
                    className="rounded bg-black px-5 py-3 text-white disabled:opacity-50"
                    type="button"
                    disabled={isFinishing || completedSetCount === 0}
                    onClick={() => void handleFinish()}
                >
                    {isFinishing ? "Finishing..." : "Finish workout"}
                </button>
            </footer>
        </section>
    );
}
