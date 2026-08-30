import {FormDialog} from "../../../../components/ui/dialogs/FormDialog";
import type {CreateExerciseInput, Exercise, UpdateExerciseInput} from "@fit-track/shared/exercises";
import {CreateExerciseForm} from "./CreateExerciseForm";
import {UpdateExerciseForm} from "./UpdateExerciseForm";

interface ExerciseFormDialogProps {
    exercise: Exercise | null;
    onCreate: (data: CreateExerciseInput) => Promise<void>;
    onUpdate: (data: UpdateExerciseInput) => Promise<void>;
    onClose: () => void;
}

export function ExerciseFormDialog({
    exercise,
    onCreate,
    onUpdate,
    onClose,
}: ExerciseFormDialogProps) {
    return (
        <FormDialog
            title={exercise ? "Edit exercise" : "Add exercise"}
            description={
                exercise
                    ? "Keep the exercise consistent so workout history remains useful."
                    : "Use a clear name you will recognize immediately during a workout."
            }
            onClose={onClose}
        >
            {exercise ? (
                <UpdateExerciseForm
                    key={exercise.id}
                    exercise={exercise}
                    onSubmit={onUpdate}
                    onCancel={onClose}
                />
            ) : (
                <CreateExerciseForm onSubmit={onCreate} />
            )}
        </FormDialog>
    );
}
