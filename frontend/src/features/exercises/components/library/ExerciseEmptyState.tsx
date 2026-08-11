import {Button} from "../../../../components/ui/Button";
import {Card} from "../../../../components/ui/Card";
import {Icon} from "../../../../components/ui/Icon";
import type {ExerciseView} from "../../hooks/useExercises";

interface ExerciseEmptyStateProps {
    view: ExerciseView;
    onCreate: () => void;
}

export function ExerciseEmptyState({view, onCreate}: ExerciseEmptyStateProps) {
    const isActive = view === "active";

    return (
        <Card className="py-14 text-center">
            <p className="font-bold text-cream">
                {isActive ? "Your library is empty." : "No archived exercises."}
            </p>
            <p className="mt-2 text-sm text-dim">
                {isActive
                    ? "Add your first movement to start building workouts."
                    : "Exercises you archive will appear here."}
            </p>
            {isActive && (
                <Button className="mt-6 w-full sm:w-auto" type="button" onClick={onCreate}>
                    <Icon name="plus" size={16} />
                    Add your first exercise
                </Button>
            )}
        </Card>
    );
}
