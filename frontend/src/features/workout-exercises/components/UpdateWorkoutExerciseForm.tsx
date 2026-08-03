import {useId, useRef, useState, type SubmitEvent} from "react";
import {z} from "zod";
import type {WorkoutExercise} from "../../workouts/workout.types.ts";
import {
    updateWorkoutExerciseSchema,
    type UpdateWorkoutExerciseInput,
} from "../schemas/workout.exercises.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {FieldError} from "../../../components/ui/FieldError.tsx";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../components/ui/formAccessibility.ts";

interface UpdateWorkoutExerciseFormProps {
    workoutExercise: WorkoutExercise;
    onSubmit: (data: UpdateWorkoutExerciseInput) => Promise<void>;
    onCancel: () => void;
}

interface UpdateWorkoutExerciseErrors {
    position?: string;
    notes?: string;
}

export function UpdateWorkoutExerciseForm({
    workoutExercise,
    onSubmit,
    onCancel,
}: UpdateWorkoutExerciseFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
    const [position, setPosition] = useState(String(workoutExercise.position));
    const [notes, setNotes] = useState(workoutExercise.notes ?? "");
    const [errors, setErrors] = useState<UpdateWorkoutExerciseErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = updateWorkoutExerciseSchema.safeParse({
            position: Number(position),
            notes: notes.trim() === "" ? null : notes,
        });

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                position: fieldErrors.position?.[0],
                notes: fieldErrors.notes?.[0],
            });
            focusFirstInvalidField(formRef);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            await onSubmit(result.data);
        } catch {
            return;
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form
            ref={formRef}
            className="form-stack rounded-[12px] border border-line bg-ink p-4"
            onSubmit={handleSubmit}
            noValidate
        >
            <label>
                Position
                <input
                    type="number"
                    min="1"
                    value={position}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.position, `${id}-position-error`)}
                    onChange={(event) => setPosition(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-position-error`}>{errors.position}</FieldError>

            <label>
                Notes
                <textarea
                    value={notes}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.notes, `${id}-notes-error`)}
                    onChange={(event) => setNotes(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-notes-error`}>{errors.notes}</FieldError>

            <div className="button-row">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save exercise"}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isSubmitting}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
