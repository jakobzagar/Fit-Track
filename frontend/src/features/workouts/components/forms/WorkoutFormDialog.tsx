import {FormDialog} from "../../../../components/ui/dialogs/FormDialog";
import type {
    CreateWorkoutInput,
    UpdateWorkoutInput,
    WorkoutSummary,
} from "@fit-track/shared/workouts";
import {CreateWorkoutForm} from "./CreateWorkoutForm";
import {UpdateWorkoutForm} from "./UpdateWorkoutForm";

interface WorkoutFormDialogProps {
    workout: WorkoutSummary | null;
    onCreate: (data: CreateWorkoutInput) => Promise<void>;
    onUpdate: (data: UpdateWorkoutInput) => Promise<void>;
    onClose: () => void;
}

export function WorkoutFormDialog({workout, onCreate, onUpdate, onClose}: WorkoutFormDialogProps) {
    return (
        <FormDialog
            title={workout ? "Edit workout" : "Create workout"}
            description={
                workout
                    ? "Update the session details without leaving your training log."
                    : "Create the session first, then add exercises and working sets."
            }
            onClose={onClose}
        >
            {workout ? (
                <UpdateWorkoutForm workout={workout} onSubmit={onUpdate} onCancel={onClose} />
            ) : (
                <CreateWorkoutForm onSubmit={onCreate} />
            )}
        </FormDialog>
    );
}
