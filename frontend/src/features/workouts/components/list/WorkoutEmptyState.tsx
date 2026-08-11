import {Button} from "../../../../components/ui/Button";
import {Card} from "../../../../components/ui/Card";
import {Icon} from "../../../../components/ui/Icon";

export function WorkoutEmptyState({onCreate}: {onCreate: () => void}) {
    return (
        <Card className="py-14 text-center">
            <p className="font-bold text-cream">No sessions logged yet.</p>
            <p className="mt-2 text-sm text-dim">Create a workout and start your first session.</p>
            <Button className="mt-6 w-full sm:w-auto" type="button" onClick={onCreate}>
                <Icon name="plus" size={16} />
                Create your first workout
            </Button>
        </Card>
    );
}
