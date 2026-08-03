import {useId, useRef, useState, type SubmitEvent} from "react";
import {z} from "zod";
import {createWorkoutSchema, type CreateWorkoutInput} from "../schemas/workout.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {FieldError} from "../../../components/ui/FieldError.tsx";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../components/ui/formAccessibility.ts";

interface CreateWorkoutFormProps {
    onSubmit: (data: CreateWorkoutInput) => Promise<void>;
}

interface CreateWorkoutErrors {
    name?: string;
    performedAt?: string;
    notes?: string;
}

export function CreateWorkoutForm({onSubmit}: CreateWorkoutFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
    const [name, setName] = useState("");
    const [performedAt, setPerformedAt] = useState("");
    const [notes, setNotes] = useState("");

    const [errors, setErrors] = useState<CreateWorkoutErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = createWorkoutSchema.safeParse({
            name,
            performedAt: performedAt === "" ? undefined : new Date(performedAt).toISOString(),
            notes: notes.trim() === "" ? undefined : notes,
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

        setName("");
        setPerformedAt("");
        setNotes("");
    }

    return (
        <form ref={formRef} className="form-stack" onSubmit={handleSubmit} noValidate>
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

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create workout"}
            </Button>
        </form>
    );
}
