import type {WorkoutSummary} from "../workout.types.ts";
import {Link} from "react-router";

interface WorkoutItemProps {
    workout: WorkoutSummary;
    onDelete: (workoutId: string) => void;
    onEdit: (workout: WorkoutSummary) => void;
    isDeleting: boolean;
}

export function WorkoutItem({workout, onDelete, onEdit, isDeleting}: WorkoutItemProps) {
    return (
        <article>
            <h2>{workout.name}</h2>

            <p>Date: {new Date(workout.performedAt).toLocaleDateString()}</p>

            <p>Exercises: {workout._count.workoutExercises}</p>

            {workout.notes && <p>{workout.notes}</p>}

            <Link to={`/workouts/${workout.id}`}>Open workout</Link>

            <button type="button" disabled={isDeleting} onClick={() => onDelete(workout.id)}>
                {isDeleting ? "Deleting..." : "Delete"}
            </button>

            <button type="button" disabled={isDeleting} onClick={() => onEdit(workout)}>
                Edit
            </button>
        </article>
    );
}
