import {useNavigate, useParams} from "react-router";
import {AddExerciseToWorkoutForm} from "../../workout-exercises/components/AddExerciseToWorkoutForm";
import {Button} from "../../../components/ui/Button";
import {Card} from "../../../components/ui/Card";
import {Feedback} from "../../../components/ui/Feedback";
import {LoadingState} from "../../../components/ui/LoadingState";
import {useConfirmDialog} from "../../../components/ui/useConfirmDialog";
import {WorkoutSessionActionBar} from "../components/WorkoutSessionActionBar";
import {WorkoutSessionExerciseCard} from "../components/WorkoutSessionExerciseCard";
import {WorkoutSessionHeader} from "../components/WorkoutSessionHeader";
import {useWorkoutSession} from "../hooks/useWorkoutSession";

export function WorkoutSessionPage() {
    const confirm = useConfirmDialog();
    const {workoutId} = useParams();
    const navigate = useNavigate();
    const {
        workout,
        exercises,
        previousByExerciseId,
        completedSetCount,
        isLoading,
        isFinishing,
        copyingExerciseId,
        error,
        addExercise: handleAddExercise,
        addSet: handleAddSet,
        copyLastSet: handleCopyLastSet,
        saveSet: handleSaveSet,
        toggleSet: handleToggleSet,
        finish: handleFinish,
        exit: handleExit,
        retry,
        onDirtyChange: handleDirtyChange,
    } = useWorkoutSession(workoutId, navigate, confirm);

    if (isLoading) {
        if (!workoutId) return <Feedback>Workout ID is missing</Feedback>;
        return <LoadingState label="Starting workout" />;
    }
    if (error && !workout) {
        return (
            <div className="page-stack">
                <Feedback>{error}</Feedback>
                <Button className="w-fit" variant="secondary" onClick={retry}>
                    Try again
                </Button>
            </div>
        );
    }
    if (!workout) return null;

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
