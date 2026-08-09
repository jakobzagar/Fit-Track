import {useId, useRef, useState, type SubmitEvent} from "react";
import {z} from "zod";
import {updateWorkoutSchema, type UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import type {WorkoutSummary} from "../workout.types.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {FieldError} from "../../../components/ui/FieldError.tsx";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../components/ui/formAccessibility.ts";
import {workoutDateInputValue} from "../workout-date.ts";

interface UpdateWorkoutFormProps {
    workout: WorkoutSummary;
    onSubmit: (data: UpdateWorkoutInput) => Promise<void>;
    onCancel: () => void;
}

interface UpdateWorkoutErrors {
    name?: string;
    performedAt?: string;
    notes?: string;
}

export function UpdateWorkoutForm({workout, onSubmit, onCancel}: UpdateWorkoutFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
    const [name, setName] = useState(workout.name);
    const [performedAt, setPerformedAt] = useState(() =>
        workoutDateInputValue(workout.performedAt),
    );
    const [notes, setNotes] = useState(workout.notes ?? "");

    const [errors, setErrors] = useState<UpdateWorkoutErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = updateWorkoutSchema.safeParse({
            name,
            performedAt: performedAt === "" ? undefined : performedAt,
            notes: notes.trim() === "" ? null : notes,
        });

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                name: fieldErrors.name?.[0],
                performedAt: fieldErrors.performedAt?.[0],
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
        <form ref={formRef} className="form-stack" onSubmit={handleSubmit} noValidate>
            <div>
                <p className="eyebrow">Editing</p>
                <h2 className="section-title mt-2">{workout.name}</h2>
            </div>

            <label>
                Name
                <input
                    value={name}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.name, `${id}-name-error`)}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>

            <label>
                Performed at
                <input
                    type="date"
                    value={performedAt}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.performedAt, `${id}-performed-at-error`)}
                    onChange={(event) => setPerformedAt(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-performed-at-error`}>{errors.performedAt}</FieldError>

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
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
                <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
