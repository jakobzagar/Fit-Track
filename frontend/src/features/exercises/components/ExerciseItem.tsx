import type {Exercise} from "../exercise.types.ts";

interface ExerciseItemProps {
    exercise: Exercise;
    onArchive: (exerciseId: string) => void;
    onEdit: (exercise: Exercise) => void;
    isArchiving: boolean;
}

export function ExerciseItem({exercise, onArchive, onEdit, isArchiving}: ExerciseItemProps) {
    return (
        <article>
            <h2>{exercise.name}</h2>

            <p>Muscle group: {exercise.muscleGroup}</p>

            <p>Equipment: {exercise.equipment ?? "No equipment"}</p>

            <p>Created: {new Date(exercise.createdAt).toLocaleDateString()}</p>

            <button type="button" disabled={isArchiving} onClick={() => onArchive(exercise.id)}>
                {isArchiving ? "Archiving..." : "Archive"}
            </button>

            <button type="button" disabled={isArchiving} onClick={() => onEdit(exercise)}>
                Edit
            </button>
        </article>
    );
}
