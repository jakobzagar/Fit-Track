import {Button} from "../../../components/ui/Button";
import {Card} from "../../../components/ui/Card";
import type {Exercise} from "../exercise.types.ts";
import {Icon} from "../../../components/ui/Icon";

interface ExerciseItemProps {
    exercise: Exercise;
    onArchive: (exerciseId: string) => void;
    onEdit: (exercise: Exercise) => void;
    isArchiving: boolean;
    isArchivedView?: boolean;
    onRestore?: (exerciseId: string) => void;
}

export function ExerciseItem({
    exercise,
    onArchive,
    onEdit,
    isArchiving,
    isArchivedView = false,
    onRestore,
}: ExerciseItemProps) {
    return (
        <Card
            as="article"
            className="group relative overflow-hidden transition hover:-translate-y-0.5 hover:border-flame/40"
        >
            <span className="absolute inset-y-0 left-0 w-1 bg-flame opacity-0 transition group-hover:opacity-100" />
            <div>
                <p className="text-[10px] font-extrabold tracking-[0.15em] text-flame uppercase">
                    {exercise.muscleGroup}
                </p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-cream">
                    {exercise.name}
                </h2>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs text-dim">
                <span>{exercise.equipment ?? "Bodyweight"}</span>
                <span>{new Date(exercise.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="button-row mt-4">
                {isArchivedView ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        disabled={isArchiving}
                        onClick={() => onRestore?.(exercise.id)}
                    >
                        <Icon name="arrow" size={14} />
                        {isArchiving ? "Restoring..." : "Restore"}
                    </Button>
                ) : (
                    <>
                        <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            disabled={isArchiving}
                            onClick={() => onEdit(exercise)}
                        >
                            <Icon name="edit" size={14} />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            type="button"
                            disabled={isArchiving}
                            onClick={() => onArchive(exercise.id)}
                        >
                            <Icon name="trash" size={16} />
                            {isArchiving ? "Archiving..." : "Archive"}
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
}
