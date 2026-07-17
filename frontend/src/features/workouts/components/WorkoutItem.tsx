import {Link} from "react-router";
import {Button} from "../../../components/ui/Button.tsx";
import {Card} from "../../../components/ui/Card.tsx";
import type {WorkoutSummary} from "../workout.types.ts";
import {Icon} from "../../../components/ui/Icon.tsx";

interface WorkoutItemProps {
    workout: WorkoutSummary;
    onDelete: (workoutId: string) => void;
    onEdit: (workout: WorkoutSummary) => void;
    isDeleting: boolean;
}

const statusStyles = {
    DRAFT: "border-line bg-white/5 text-dim",
    ACTIVE: "border-flame/40 bg-flame/10 text-flame",
    COMPLETED: "border-positive/30 bg-positive/8 text-positive",
};

export function WorkoutItem({workout, onDelete, onEdit, isDeleting}: WorkoutItemProps) {
    return (
        <Card as="article" className="group relative overflow-hidden">
            {workout.status === "ACTIVE" && (
                <span className="absolute inset-y-0 left-0 w-1 bg-flame" />
            )}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] uppercase ${statusStyles[workout.status]}`}
                    >
                        {workout.status}
                    </span>
                    <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-cream">
                        {workout.name}
                    </h2>
                </div>
                <div className="text-right">
                    <p className="metric-number text-2xl font-black text-flame">
                        {workout._count.workoutExercises}
                    </p>
                    <p className="text-[10px] tracking-[0.1em] text-dim uppercase">Exercises</p>
                </div>
            </div>

            <p className="mt-3 text-xs font-semibold tracking-[0.05em] text-dim uppercase">
                {new Date(workout.performedAt).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })}
            </p>
            {workout.notes && (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-dim">{workout.notes}</p>
            )}

            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-4">
                {workout.status !== "COMPLETED" ? (
                    <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-[9px] border border-flame bg-flame px-2 text-center text-xs font-extrabold tracking-[0.04em] text-ink uppercase transition hover:bg-flame-bright"
                        to={`/workouts/${workout.id}/session`}
                    >
                        <Icon name="arrow" size={15} />
                        {workout.status === "ACTIVE" ? "Continue workout" : "Start workout"}
                    </Link>
                ) : (
                    <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-[9px] border border-line bg-panel-raised px-2 text-center text-xs font-extrabold tracking-[0.04em] text-cream uppercase transition hover:border-flame/60"
                        to={`/workouts/${workout.id}`}
                    >
                        View workout
                    </Link>
                )}
                <Button
                    className="w-full"
                    size="sm"
                    variant="ghost"
                    type="button"
                    disabled={isDeleting}
                    onClick={() => onEdit(workout)}
                >
                    <Icon name="edit" size={14} />
                    Edit
                </Button>
                <Button
                    className="w-full"
                    size="sm"
                    variant="danger"
                    type="button"
                    disabled={isDeleting}
                    onClick={() => onDelete(workout.id)}
                >
                    <Icon className="shrink-0" name="trash" size={18} />
                    {isDeleting ? "Deleting..." : "Delete"}
                </Button>
            </div>
        </Card>
    );
}
