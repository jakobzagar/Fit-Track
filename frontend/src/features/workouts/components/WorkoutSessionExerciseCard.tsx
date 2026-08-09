import {Button} from "../../../components/ui/Button";
import {Card} from "../../../components/ui/Card";
import {NewWorkoutSetInlineRow} from "../../workout-exercises/components/NewWorkoutSetInlineRow";
import {WorkoutSetInlineRow} from "../../workout-exercises/components/WorkoutSetInlineRow";
import type {
    CreateWorkoutSetInput,
    UpdateWorkoutSetInput,
} from "../../workout-exercises/schemas/workout.exercises.schemas";
import type {PreviousPerformance, WorkoutExercise, WorkoutSet} from "../workout.types";
import {formatWorkoutDate} from "../workout-date";

interface WorkoutSessionExerciseCardProps {
    workoutExercise: WorkoutExercise;
    previous?: PreviousPerformance;
    disabled: boolean;
    isCopying: boolean;
    onAddSet: (data: CreateWorkoutSetInput) => Promise<void>;
    onCopyLastSet: (lastSet: WorkoutSet) => void;
    onSaveSet: (setId: string, data: UpdateWorkoutSetInput) => Promise<void>;
    onToggleSet: (setId: string, completed: boolean, data: UpdateWorkoutSetInput) => Promise<void>;
    onDirtyChange: (setId: string, isDirty: boolean) => void;
}

export function WorkoutSessionExerciseCard({
    workoutExercise,
    previous,
    disabled,
    isCopying,
    onAddSet,
    onCopyLastSet,
    onSaveSet,
    onToggleSet,
    onDirtyChange,
}: WorkoutSessionExerciseCardProps) {
    const lastSet = workoutExercise.sets.at(-1);
    const completedCount = workoutExercise.sets.filter((set) => set.completedAt !== null).length;

    return (
        <Card as="article" className="space-y-6">
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
                    {completedCount}/{workoutExercise.sets.length} done
                </span>
            </div>
            {previous ? (
                <div className="border-l-2 border-flame bg-flame/6 px-4 py-3 text-sm text-dim">
                    <strong className="text-cream">
                        Previous ({formatWorkoutDate(previous.performedAt)}):
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
                        disabled={disabled}
                        onSave={(data) => onSaveSet(set.id, data)}
                        onToggleCompletion={(completed, data) =>
                            onToggleSet(set.id, completed, data)
                        }
                        onDirtyChange={onDirtyChange}
                    />
                ))}
                <NewWorkoutSetInlineRow
                    setNumber={workoutExercise.sets.length + 1}
                    onSubmit={onAddSet}
                />
            </div>
            {lastSet && (
                <div className="flex justify-end border-t border-line pt-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={isCopying}
                        onClick={() => onCopyLastSet(lastSet)}
                    >
                        {isCopying ? "Copying..." : "Copy last set"}
                    </Button>
                </div>
            )}
        </Card>
    );
}
