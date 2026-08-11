import {Button} from "../../../../components/ui/Button";
import {Card} from "../../../../components/ui/Card";
import {Icon} from "../../../../components/ui/Icon";
import {AddWorkoutSetForm} from "../../../workout-exercises/components/sets/AddWorkoutSetForm";
import {UpdateWorkoutExerciseForm} from "../../../workout-exercises/components/exercises/UpdateWorkoutExerciseForm";
import {UpdateWorkoutSetForm} from "../../../workout-exercises/components/sets/UpdateWorkoutSetForm";
import type {
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
} from "../../../workout-exercises/schemas/workout.exercises.schemas";
import type {WorkoutExercise, WorkoutSet} from "../../workout.types";

interface WorkoutExerciseCardProps {
    workoutExercise: WorkoutExercise;
    readOnly?: boolean;
    editingWorkoutExercise: WorkoutExercise | null;
    editingWorkoutSet: WorkoutSet | null;
    deletingWorkoutExerciseId: string | null;
    deletingWorkoutSetId: string | null;
    onEditExercise: (workoutExercise: WorkoutExercise | null) => void;
    onUpdateExercise: (data: UpdateWorkoutExerciseInput) => Promise<void>;
    onDeleteExercise: (workoutExerciseId: string) => void;
    onEditSet: (set: WorkoutSet | null) => void;
    onUpdateSet: (data: UpdateWorkoutSetInput) => Promise<void>;
    onDeleteSet: (workoutExerciseId: string, setId: string) => void;
    onAddSet: (data: CreateWorkoutSetInput) => Promise<void>;
}

export function WorkoutExerciseCard({
    workoutExercise,
    readOnly = false,
    editingWorkoutExercise,
    editingWorkoutSet,
    deletingWorkoutExerciseId,
    deletingWorkoutSetId,
    onEditExercise,
    onUpdateExercise,
    onDeleteExercise,
    onEditSet,
    onUpdateSet,
    onDeleteSet,
    onAddSet,
}: WorkoutExerciseCardProps) {
    return (
        <Card as="article" className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                    <p className="text-[10px] font-extrabold tracking-[0.14em] text-flame uppercase">
                        Exercise {workoutExercise.position}
                    </p>
                    <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-cream">
                        {workoutExercise.exercise.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-dim uppercase">
                        {workoutExercise.exercise.muscleGroup}
                    </p>
                </div>

                {!readOnly && editingWorkoutExercise?.id !== workoutExercise.id && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            disabled={deletingWorkoutExerciseId === workoutExercise.id}
                            onClick={() => onEditExercise(workoutExercise)}
                        >
                            <Icon name="edit" size={14} />
                            Edit
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            type="button"
                            disabled={deletingWorkoutExerciseId === workoutExercise.id}
                            onClick={() => onDeleteExercise(workoutExercise.id)}
                        >
                            <Icon name="trash" size={16} />
                            {deletingWorkoutExerciseId === workoutExercise.id
                                ? "Deleting..."
                                : "Delete"}
                        </Button>
                    </div>
                )}
            </div>

            {workoutExercise.notes && (
                <p className="rounded-[10px] border border-line bg-white/[0.025] px-4 py-3 text-sm leading-6 text-dim">
                    {workoutExercise.notes}
                </p>
            )}

            {!readOnly && editingWorkoutExercise?.id === workoutExercise.id && (
                <UpdateWorkoutExerciseForm
                    workoutExercise={editingWorkoutExercise}
                    onSubmit={onUpdateExercise}
                    onCancel={() => onEditExercise(null)}
                />
            )}

            {workoutExercise.sets.length === 0 ? (
                <p className="rounded-[10px] border border-dashed border-line py-6 text-center text-sm text-dim">
                    No sets added yet
                </p>
            ) : (
                <div className="space-y-3 border-t border-line pt-5">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="eyebrow">Performance</p>
                            <h4 className="mt-1 text-base font-extrabold text-cream">
                                Logged sets
                            </h4>
                        </div>
                        <span className="text-xs font-bold tracking-[0.08em] text-dim uppercase">
                            {workoutExercise.sets.length} total
                        </span>
                    </div>
                    <ul className="grid gap-2">
                        {workoutExercise.sets.map((set) => (
                            <li
                                className="rounded-[11px] border border-line bg-ink p-3"
                                key={set.id}
                            >
                                {!readOnly && editingWorkoutSet?.id === set.id ? (
                                    <UpdateWorkoutSetForm
                                        workoutSet={editingWorkoutSet}
                                        onSubmit={onUpdateSet}
                                        onCancel={() => onEditSet(null)}
                                    />
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:items-center">
                                        <div className="flex items-center gap-3 sm:contents">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-panel text-xs font-black text-cream">
                                                {set.setNumber}
                                            </span>
                                            <div className="grid flex-1 grid-cols-3 gap-2">
                                                <SetMetric
                                                    label="Weight"
                                                    value={set.weight}
                                                    unit="kg"
                                                />
                                                <SetMetric
                                                    label="Reps"
                                                    value={set.reps}
                                                    unit="reps"
                                                />
                                                <SetMetric
                                                    label="Duration"
                                                    value={set.durationSeconds}
                                                    unit="sec"
                                                />
                                            </div>
                                        </div>
                                        {!readOnly && (
                                            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type="button"
                                                    disabled={deletingWorkoutSetId === set.id}
                                                    onClick={() => onEditSet(set)}
                                                >
                                                    <Icon name="edit" size={14} />
                                                    Edit set
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    type="button"
                                                    disabled={deletingWorkoutSetId === set.id}
                                                    onClick={() =>
                                                        onDeleteSet(workoutExercise.id, set.id)
                                                    }
                                                >
                                                    <Icon name="trash" size={16} />
                                                    {deletingWorkoutSetId === set.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {!readOnly && (
                <div className="border-t border-line pt-5">
                    <p className="mb-4 text-xs font-extrabold tracking-[0.1em] text-dim uppercase">
                        Add another set
                    </p>
                    <AddWorkoutSetForm onSubmit={onAddSet} />
                </div>
            )}
        </Card>
    );
}

function SetMetric({label, value, unit}: {label: string; value: number | null; unit: string}) {
    return (
        <div className="rounded-[8px] border border-line bg-panel px-3 py-2">
            <span className="block text-[9px] font-extrabold tracking-[0.12em] text-dim uppercase">
                {label}
            </span>
            <strong className="metric-number mt-1 block text-sm text-cream">
                {value ?? "—"}
                <small className="ml-1 text-[10px] font-bold text-dim">{unit}</small>
            </strong>
        </div>
    );
}
