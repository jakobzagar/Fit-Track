import {Link, useParams} from "react-router";
import {AddExerciseToWorkoutForm} from "../../workout-exercises/components/AddExerciseToWorkoutForm";
import {Button} from "../../../components/ui/Button";
import {Card} from "../../../components/ui/Card";
import {Feedback} from "../../../components/ui/Feedback";
import {LoadingState} from "../../../components/ui/LoadingState";
import {PageHeader} from "../../../components/ui/PageHeader";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog";
import {WorkoutExerciseCard} from "../components/WorkoutExerciseCard";
import {useWorkoutDetail} from "../hooks/useWorkoutDetail";
import {formatWorkoutDate} from "../workout-date";

export function WorkoutDetailPage() {
    const confirm = useConfirmDialog();
    const {workoutId} = useParams();
    const {
        workout,
        exercises,
        editingWorkoutExercise,
        editingWorkoutSet,
        deletingWorkoutExerciseId,
        deletingWorkoutSetId,
        isLoading,
        loadError,
        mutationError,
        setEditingWorkoutExercise,
        setEditingWorkoutSet,
        addExercise: handleAddExercise,
        addSet: handleAddSet,
        updateExercise: handleUpdateWorkoutExercise,
        removeExercise: handleDeleteWorkoutExercise,
        updateSet: handleUpdateWorkoutSet,
        removeSet: handleDeleteWorkoutSet,
        retry,
    } = useWorkoutDetail(workoutId, confirm);

    if (isLoading) {
        if (!workoutId) return <Feedback>Workout ID is missing</Feedback>;
        return <LoadingState label="Loading workout" />;
    }

    if (loadError) {
        return (
            <div className="page-stack">
                <Feedback>{loadError}</Feedback>
                <Button className="w-fit" variant="secondary" onClick={retry}>
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
                description={`${formatWorkoutDate(workout.performedAt, {day: "2-digit", month: "long", year: "numeric"})}${workout.notes ? ` · ${workout.notes}` : ""}`}
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

            {workout.status !== "COMPLETED" && (
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
            )}

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
                            readOnly={workout.status === "COMPLETED"}
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
