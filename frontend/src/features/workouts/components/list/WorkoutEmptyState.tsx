import {Button} from "../../../../components/ui/actions/Button";
import {Card} from "../../../../components/ui/display/Card";
import {Icon} from "../../../../components/ui/display/Icon";

export function WorkoutEmptyState({onCreate}: {onCreate: () => void}) {
    return (
        <Card className="py-14 text-center">
            <p className="font-bold text-cream">No workouts logged yet.</p>
            <p className="mt-2 text-sm text-dim">Create and start your first workout.</p>
            <Button className="mt-6 w-full sm:w-auto" type="button" onClick={onCreate}>
                <Icon name="plus" size={16} />
                Create your first workout
            </Button>
        </Card>
    );
}
