import type {WorkoutSummary} from "../workout.types.ts";
import {WorkoutItem} from "./WorkoutItem.tsx";

interface WorkoutListProps {
    workouts: WorkoutSummary[];
    onDelete: (workoutId: string) => void;
    onEdit: (workout: WorkoutSummary) => void;
    deletingWorkoutId: string | null;
}

export function WorkoutList({workouts, onDelete, onEdit, deletingWorkoutId}: WorkoutListProps) {
    return (
        <section>
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
