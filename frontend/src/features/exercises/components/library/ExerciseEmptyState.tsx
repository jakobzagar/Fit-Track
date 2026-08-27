import {Button} from "../../../../components/ui/actions/Button";
import {Card} from "../../../../components/ui/display/Card";
import {Icon} from "../../../../components/ui/display/Icon";
import type {ExerciseStatus} from "@fit-track/shared/exercises";

interface ExerciseEmptyStateProps {
    status: ExerciseStatus;
    onCreate: () => void;
}

export function ExerciseEmptyState({status, onCreate}: ExerciseEmptyStateProps) {
    const isActive = status === "active";

    return (
        <Card className="py-14 text-center">
            <p className="font-bold text-cream">
                {isActive ? "Your library is empty." : "No archived exercises."}
            </p>
            <p className="mt-2 text-sm text-dim">
                {isActive
                    ? "Add your first exercise to start building workouts."
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
