import type {WorkoutSummary} from "@fit-track/shared/workouts";
import {WorkoutItem} from "./WorkoutItem";

interface WorkoutListProps {
    workouts: WorkoutSummary[];
    onDelete: (workoutId: string) => void;
    onEdit: (workout: WorkoutSummary) => void;
    deletingWorkoutId: string | null;
}

export function WorkoutList({workouts, onDelete, onEdit, deletingWorkoutId}: WorkoutListProps) {
    return (
        <section className="card-grid">
            {workouts.map((workout) => (
                <WorkoutItem
                    key={workout.id}
                    workout={workout}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isDeleting={deletingWorkoutId === workout.id}
                />
            ))}
        </section>
    );
}
