import {useState, type SubmitEvent} from "react";
import {z} from "zod";
import {createWorkoutSchema, type CreateWorkoutInput} from "../schemas/workout.schemas.ts";

interface CreateWorkoutFormProps {
    onSubmit: (data: CreateWorkoutInput) => Promise<void>;
}

interface CreateWorkoutErrors {
    name?: string;
    performedAt?: string;
    notes?: string;
}

export function CreateWorkoutForm({onSubmit}: CreateWorkoutFormProps) {
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
        <form onSubmit={handleSubmit} noValidate>
            <label>
                Name
                <input
                    value={name}
                    disabled={isSubmitting}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>

            {errors.name && <p>{errors.name}</p>}

            <label>
                Performed at
                <input
                    type="datetime-local"
                    value={performedAt}
                    disabled={isSubmitting}
                    onChange={(event) => setPerformedAt(event.target.value)}
                />
            </label>

            {errors.performedAt && <p>{errors.performedAt}</p>}

            <label>
                Notes
                <textarea
                    value={notes}
                    disabled={isSubmitting}
                    onChange={(event) => setNotes(event.target.value)}
                />
            </label>

            {errors.notes && <p>{errors.notes}</p>}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create workout"}
            </button>
        </form>
    );
}
