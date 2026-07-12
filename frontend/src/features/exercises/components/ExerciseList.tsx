import type {Exercise} from "../exercise.types";
import {ExerciseItem} from "./ExerciseItem";

interface ExerciseListProps {
    exercises: Exercise[];
    onArchive: (exerciseId: string) => void;
    onEdit: (exercise: Exercise) => void;
    archivingExerciseId: string | null;
    isArchivedView?: boolean;
    onRestore?: (exerciseId: string) => void;
}

export function ExerciseList({
    exercises,
    onArchive,
    onEdit,
    archivingExerciseId,
    isArchivedView = false,
    onRestore,
}: ExerciseListProps) {
    return (
        <section className="card-grid">
            {exercises.map((exercise) => (
                <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    onArchive={onArchive}
                    onEdit={onEdit}
                    isArchiving={archivingExerciseId === exercise.id}
                    isArchivedView={isArchivedView}
                    onRestore={onRestore}
                />
            ))}
        </section>
    );
}
