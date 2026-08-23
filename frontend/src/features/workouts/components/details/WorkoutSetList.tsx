import {Button} from "../../../../components/ui/actions/Button";
import {Icon} from "../../../../components/ui/display/Icon";
import {UpdateWorkoutSetForm} from "../../../workout-exercises/components/sets/UpdateWorkoutSetForm";
import type {UpdateWorkoutSetInput} from "@fit-track/shared/workout-exercises";
import type {WorkoutSet} from "@fit-track/shared/workouts";

interface WorkoutSetListProps {
    workoutExerciseId: string;
    sets: WorkoutSet[];
    readOnly: boolean;
    editingSet: WorkoutSet | null;
    deletingSetId: string | null;
    onEdit: (set: WorkoutSet | null) => void;
    onUpdate: (data: UpdateWorkoutSetInput) => Promise<void>;
    onDelete: (workoutExerciseId: string, setId: string) => void;
}

export function WorkoutSetList({
    workoutExerciseId,
    sets,
    readOnly,
    editingSet,
    deletingSetId,
    onEdit,
    onUpdate,
    onDelete,
}: WorkoutSetListProps) {
    if (sets.length === 0) {
        return (
            <p className="rounded-[10px] border border-dashed border-line py-6 text-center text-sm text-dim">
                No sets added yet
            </p>
        );
    }

    return (
        <div className="space-y-3 border-t border-line pt-5">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="eyebrow">Performance</p>
                    <h4 className="mt-1 text-base font-extrabold text-cream">Logged sets</h4>
                </div>
                <span className="text-xs font-bold tracking-[0.08em] text-dim uppercase">
                    {sets.length} total
                </span>
            </div>
            <ul className="grid gap-2">
                {sets.map((set) => (
                    <li className="rounded-[11px] border border-line bg-ink p-3" key={set.id}>
                        {!readOnly && editingSet?.id === set.id ? (
                            <UpdateWorkoutSetForm
                                workoutSet={editingSet}
                                onSubmit={onUpdate}
                                onCancel={() => onEdit(null)}
                            />
                        ) : (
                            <WorkoutSetSummary
                                set={set}
                                readOnly={readOnly}
                                isDeleting={deletingSetId === set.id}
                                onEdit={() => onEdit(set)}
                                onDelete={() => onDelete(workoutExerciseId, set.id)}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function WorkoutSetSummary({
    set,
    readOnly,
    isDeleting,
    onEdit,
    onDelete,
}: {
    set: WorkoutSet;
    readOnly: boolean;
    isDeleting: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:items-center">
            <div className="flex items-center gap-3 sm:contents">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-panel text-xs font-black text-cream">
                    {set.setNumber}
                </span>
                <div className="grid flex-1 grid-cols-3 gap-2">
                    <SetMetric label="Weight" value={set.weight} unit="kg" />
                    <SetMetric label="Reps" value={set.reps} unit="reps" />
                    <SetMetric label="Duration" value={set.durationSeconds} unit="sec" />
                </div>
            </div>
            {!readOnly && (
                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        disabled={isDeleting}
                        onClick={onEdit}
                    >
                        <Icon name="edit" size={14} />
                        Edit set
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        disabled={isDeleting}
                        onClick={onDelete}
                    >
                        <Icon name="trash" size={16} />
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            )}
        </div>
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
