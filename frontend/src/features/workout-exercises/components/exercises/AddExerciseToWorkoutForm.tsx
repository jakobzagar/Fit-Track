import {useId, useRef, useState, type SubmitEvent} from "react";
import {z} from "zod";
import type {Exercise} from "@fit-track/shared/exercises";
import {
    addExerciseToWorkoutSchema,
    type AddExerciseToWorkoutInput,
} from "@fit-track/shared/workout-exercises";
import {Button} from "../../../../components/ui/actions/Button";
import {FieldError} from "../../../../components/ui/forms/FieldError";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../../components/ui/forms/utils/formAccessibility";
import {apiValidationErrors} from "../../../../components/ui/forms/utils/apiValidationErrors";

interface AddExerciseToWorkoutFormProps {
    exercises: Exercise[];
    onSubmit: (data: AddExerciseToWorkoutInput) => Promise<void>;
}

interface AddExerciseToWorkoutErrors {
    exerciseId?: string;
    notes?: string;
}

export function AddExerciseToWorkoutForm({exercises, onSubmit}: AddExerciseToWorkoutFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
    const [exerciseId, setExerciseId] = useState("");
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState<AddExerciseToWorkoutErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = addExerciseToWorkoutSchema.safeParse({
            exerciseId,
            notes: notes.trim() === "" ? undefined : notes,
        });

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                exerciseId: fieldErrors.exerciseId?.[0],
                notes: fieldErrors.notes?.[0],
            });
            focusFirstInvalidField(formRef);

            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            await onSubmit(result.data);
        } catch (error) {
            const serverErrors = apiValidationErrors(error);
            if (serverErrors) {
                setErrors(serverErrors);
                focusFirstInvalidField(formRef);
            }
            return;
        } finally {
            setIsSubmitting(false);
        }

        setExerciseId("");
        setNotes("");
    }

    if (exercises.length === 0) {
        return (
            <p className="text-sm text-dim">Every available exercise is already in this workout.</p>
        );
    }

    return (
        <form ref={formRef} className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="grid content-start gap-3">
                <label>
                    Exercise
                    <select
                        value={exerciseId}
                        disabled={isSubmitting}
                        {...invalidFieldProps(errors.exerciseId, `${id}-exercise-error`)}
                        onChange={(event) => setExerciseId(event.target.value)}
                    >
                        <option value="">Select exercise</option>
                        {exercises.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                                {exercise.name}
                            </option>
                        ))}
                    </select>
                </label>
                <FieldError id={`${id}-exercise-error`}>{errors.exerciseId}</FieldError>

                <Button fullWidth type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add exercise"}
                </Button>
            </div>

            <div className="grid h-full gap-2">
                <label className="grid h-full grid-rows-[auto_1fr]">
                    Notes
                    <textarea
                        className="h-full min-h-0"
                        value={notes}
                        disabled={isSubmitting}
                        {...invalidFieldProps(errors.notes, `${id}-notes-error`)}
                        onChange={(event) => setNotes(event.target.value)}
                    />
                </label>
                <FieldError id={`${id}-notes-error`}>{errors.notes}</FieldError>
            </div>
        </form>
    );
}
