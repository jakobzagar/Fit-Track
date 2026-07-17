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
import {NewWorkoutSetInlineRow} from "../../workout-exercises/components/NewWorkoutSetInlineRow.tsx";
import {WorkoutSetInlineRow} from "../../workout-exercises/components/WorkoutSetInlineRow.tsx";
import {Button} from "../../../components/ui/Button.tsx";
import {Card} from "../../../components/ui/Card.tsx";
import {Feedback} from "../../../components/ui/Feedback.tsx";
import {LoadingState} from "../../../components/ui/LoadingState.tsx";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog.ts";

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

    useEffect(() => {
        function warnBeforeLeaving(event: BeforeUnloadEvent) {
            if (workout?.status === "ACTIVE" && !isFinishing) {
                event.preventDefault();
            }
        }

        window.addEventListener("beforeunload", warnBeforeLeaving);
        return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
    }, [isFinishing, workout?.status]);

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

    if (isLoading) return <LoadingState label="Starting workout" />;
    if (error && !workout) return <Feedback>{error}</Feedback>;
    if (!workout) return null;

    const completedSetCount = workout.workoutExercises.reduce(
        (count, workoutExercise) =>
            count +
            workoutExercise.sets.filter((workoutSet) => workoutSet.completedAt !== null).length,
        0,
    );

    return (
        <section className="mx-auto max-w-4xl space-y-6">
            <header className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
                <div>
                    <p className="eyebrow">Live session</p>
                    <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] text-cream sm:text-5xl">
                        {workout.name}
                    </h1>
                    <p className="mt-3 flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-positive uppercase">
                        <span className="size-2 animate-pulse rounded-full bg-positive" />
                        Workout in progress
                    </p>
                </div>
                <Link
                    className="text-xs font-bold tracking-[0.08em] text-dim uppercase hover:text-cream"
                    to={`/workouts/${workout.id}`}
                    onClick={(event) => {
                        event.preventDefault();
                        void confirm({
                            title: "Leave active workout?",
                            message:
                                "Your saved sets will remain and you can continue this session later.",
                            confirmLabel: "Leave session",
                        }).then((confirmed) => {
                            if (confirmed) navigate(`/workouts/${workout.id}`);
                        });
                    }}
                >
                    Exit session →
                </Link>
            </header>

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

            {workout.workoutExercises.map((workoutExercise) => {
                const previous = previousByExerciseId.get(workoutExercise.exerciseId);
                const lastSet = workoutExercise.sets.at(-1);
                return (
                    <Card as="article" className="space-y-6" key={workoutExercise.id}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-extrabold tracking-[0.14em] text-flame uppercase">
                                    Exercise {workoutExercise.position}
                                </p>
                                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-cream">
                                    {workoutExercise.exercise.name}
                                </h2>
                                <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-dim uppercase">
                                    {workoutExercise.exercise.muscleGroup}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-[10px] font-extrabold tracking-[0.08em] text-dim uppercase">
                                {
                                    workoutExercise.sets.filter((set) => set.completedAt !== null)
                                        .length
                                }
                                /{workoutExercise.sets.length} done
                            </span>
                        </div>
                        {previous ? (
                            <div className="border-l-2 border-flame bg-flame/6 px-4 py-3 text-sm text-dim">
                                <strong className="text-cream">
                                    Previous ({new Date(previous.performedAt).toLocaleDateString()}
                                    ):
                                </strong>{" "}
                                {previous.sets
                                    .map((set) =>
                                        set.durationSeconds !== null
                                            ? `${set.durationSeconds} sec`
                                            : `${set.weight ?? "–"} kg × ${set.reps ?? "–"}`,
                                    )
                                    .join(" · ")}
                            </div>
                        ) : (
                            <p className="text-sm text-dim">
                                No previous performance — set the baseline today.
                            </p>
                        )}
                        <div className="space-y-3 border-t border-line pt-5">
                            <div className="hidden grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_148px] gap-3 px-3 text-[10px] font-extrabold tracking-[0.12em] text-dim uppercase md:grid">
                                <span className="text-center">Set</span>
                                <span>Weight</span>
                                <span>Reps</span>
                                <span>Duration</span>
                                <span className="text-center">Actions</span>
                            </div>
                            {workoutExercise.sets.map((set) => (
                                <WorkoutSetInlineRow
                                    key={set.id}
                                    workoutSet={set}
                                    disabled={workout.status !== "ACTIVE"}
                                    onSave={(data) =>
                                        handleSaveSet(workoutExercise.id, set.id, data)
                                    }
                                    onToggleCompletion={(completed, data) =>
                                        handleToggleSet(workoutExercise.id, set.id, completed, data)
                                    }
                                />
                            ))}
                            <NewWorkoutSetInlineRow
                                setNumber={workoutExercise.sets.length + 1}
                                onSubmit={(data) => handleAddSet(workoutExercise.id, data)}
                            />
                        </div>
                        {lastSet && (
                            <div className="flex justify-end border-t border-line pt-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    disabled={copyingExerciseId === workoutExercise.id}
                                    onClick={() =>
                                        void handleCopyLastSet(workoutExercise.id, lastSet)
                                    }
                                >
                                    {copyingExerciseId === workoutExercise.id
                                        ? "Copying..."
                                        : "Copy last set"}
                                </Button>
                            </div>
                        )}
                    </Card>
                );
            })}

            <footer className="sticky bottom-22 z-30 flex flex-col items-stretch justify-between gap-3 rounded-[14px] border border-line bg-panel/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center md:bottom-6">
                <div>
                    <span className="metric-number text-xl font-black text-cream">
                        {completedSetCount}
                    </span>
                    <span className="ml-2 text-xs font-bold tracking-[0.08em] text-dim uppercase">
                        completed sets
                    </span>
                </div>
                <Button
                    className="w-full sm:w-auto"
                    size="lg"
                    type="button"
                    disabled={isFinishing || completedSetCount === 0}
                    onClick={() => void handleFinish()}
                >
                    {isFinishing ? "Finishing..." : "Finish workout"}
                </Button>
            </footer>
        </section>
    );
}
