import type {Exercise} from "../exercise.types";
import {ExerciseItem} from "./ExerciseItem";

interface ExerciseListProps {
    exercises: Exercise[];
    onArchive: (exerciseId: string) => void;
    onEdit: (exercise: Exercise) => void;
    archivingExerciseId: string | null;
}

export function ExerciseList({
    exercises,
    onArchive,
    onEdit,
    archivingExerciseId,
}: ExerciseListProps) {
    return (
        <section>
            {exercises.map((exercise) => (
                <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    onArchive={onArchive}
                    onEdit={onEdit}
                    isArchiving={archivingExerciseId === exercise.id}
                />
            ))}
        </section>
    );
}
