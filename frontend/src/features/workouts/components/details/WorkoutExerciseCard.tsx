import {Button} from "../../../../components/ui/actions/Button";
import {Card} from "../../../../components/ui/display/Card";
import {Icon} from "../../../../components/ui/display/Icon";
import {AddWorkoutSetForm} from "../../../workout-exercises/components/sets/AddWorkoutSetForm";
import {UpdateWorkoutExerciseForm} from "../../../workout-exercises/components/exercises/UpdateWorkoutExerciseForm";
import type {
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
} from "../../../workout-exercises/schemas/workout-exercises.schemas";
import type {WorkoutExercise, WorkoutSet} from "../../types/workout.types";
import {WorkoutSetList} from "./WorkoutSetList";

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

            <WorkoutSetList
                workoutExerciseId={workoutExercise.id}
                sets={workoutExercise.sets}
                readOnly={readOnly}
                editingSet={editingWorkoutSet}
                deletingSetId={deletingWorkoutSetId}
                onEdit={onEditSet}
                onUpdate={onUpdateSet}
                onDelete={onDeleteSet}
            />

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
