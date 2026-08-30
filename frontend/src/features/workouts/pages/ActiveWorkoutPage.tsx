import {useNavigate, useParams} from "react-router";
import {AddExerciseToWorkoutForm} from "../workout-exercises/components/exercises/AddExerciseToWorkoutForm";
import {Button} from "../../../components/ui/actions/Button";
import {Card} from "../../../components/ui/display/Card";
import {StatusMessage} from "../../../components/ui/feedback/StatusMessage";
import {LoadingState} from "../../../components/ui/display/LoadingState";
import {useConfirmDialog} from "../../../components/ui/dialogs/hooks/useConfirmDialog";
import {ActiveWorkoutActionBar} from "../components/active-workout/ActiveWorkoutActionBar";
import {ActiveWorkoutExerciseCard} from "../components/active-workout/ActiveWorkoutExerciseCard";
import {ActiveWorkoutHeader} from "../components/active-workout/ActiveWorkoutHeader";
import {useActiveWorkout} from "../hooks/active-workout/useActiveWorkout";

export function ActiveWorkoutPage() {
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
        isCancelling,
        copyingExerciseId,
        error,
        addExerciseToWorkout: handleAddExercise,
        addWorkoutSet: handleAddSet,
        copyPreviousSet: handleCopyLastSet,
        saveWorkoutSet: handleSaveSet,
        toggleWorkoutSetCompletion: handleToggleSet,
        finishActiveWorkout: handleFinish,
        cancelActiveWorkout: handleCancel,
        exitActiveWorkout: handleExit,
        retryLoad,
        setWorkoutSetDirty: handleDirtyChange,
    } = useActiveWorkout(workoutId, navigate, confirm);

    if (isLoading) {
        if (!workoutId) return <StatusMessage>Workout ID is missing</StatusMessage>;
        return <LoadingState label="Starting workout" />;
    }
    if (error && !workout) {
        return (
            <div className="page-stack">
                <StatusMessage>{error}</StatusMessage>
                <Button className="w-fit" variant="secondary" onClick={retryLoad}>
                    Try again
                </Button>
            </div>
        );
    }
    if (!workout) return null;

    return (
        <section className="mx-auto max-w-4xl space-y-6">
            <ActiveWorkoutHeader
                workout={workout}
                completedSetCount={completedSetCount}
                onExit={handleExit}
            />

            {error && <StatusMessage>{error}</StatusMessage>}

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
                    <p className="font-bold text-cream">This workout needs an exercise.</p>
                    <p className="mt-2 text-sm text-dim">
                        Add an exercise above, then log your first set.
                    </p>
                </Card>
            )}

            {workout.workoutExercises.map((workoutExercise) => (
                <ActiveWorkoutExerciseCard
                    key={workoutExercise.id}
                    workoutExercise={workoutExercise}
                    previous={previousByExerciseId.get(workoutExercise.exerciseId)}
                    disabled={workout.status !== "ACTIVE"}
                    isCopying={copyingExerciseId === workoutExercise.id}
                    onAddSet={(data) => handleAddSet(workoutExercise.id, data)}
                    onCopyLastSet={(lastSet) => void handleCopyLastSet(workoutExercise.id, lastSet)}
                    onSaveSet={(workoutSetId, data) =>
                        handleSaveSet(workoutExercise.id, workoutSetId, data)
                    }
                    onToggleSet={(workoutSetId, completed, data) =>
                        handleToggleSet(workoutExercise.id, workoutSetId, completed, data)
                    }
                    onDirtyChange={handleDirtyChange}
                />
            ))}

            <ActiveWorkoutActionBar
                completedSetCount={completedSetCount}
                isFinishing={isFinishing}
                isCancelling={isCancelling}
                onFinish={() => void handleFinish()}
                onCancel={() => void handleCancel()}
            />
        </section>
    );
}
