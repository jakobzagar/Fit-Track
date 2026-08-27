import type {Exercise} from "@fit-track/shared/exercises";
import {ExerciseItem} from "./ExerciseItem";

interface ExerciseListProps {
    exercises: Exercise[];
    onArchive: (exerciseId: string) => void;
    onEdit: (exercise: Exercise) => void;
    updatingExerciseStatusId: string | null;
    isArchivedView?: boolean;
    onRestore?: (exerciseId: string) => void;
}

export function ExerciseList({
    exercises,
    onArchive,
    onEdit,
    updatingExerciseStatusId,
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
                    isUpdatingStatus={updatingExerciseStatusId === exercise.id}
                    isArchivedView={isArchivedView}
                    onRestore={onRestore}
                />
            ))}
        </section>
    );
}
