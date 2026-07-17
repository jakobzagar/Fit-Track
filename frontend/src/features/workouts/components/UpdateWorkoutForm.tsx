import {useState, type SubmitEvent} from "react";
import {z} from "zod";
import {updateWorkoutSchema, type UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import type {WorkoutSummary} from "../workout.types.ts";
import {Button} from "../../../components/ui/Button.tsx";

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
    const [name, setName] = useState(workout.name);
    const [performedAt, setPerformedAt] = useState(() => {
        const date = new Date(workout.performedAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    });
    const [notes, setNotes] = useState(workout.notes ?? "");

    const [errors, setErrors] = useState<UpdateWorkoutErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = updateWorkoutSchema.safeParse({
            name,
            performedAt: performedAt === "" ? undefined : new Date(performedAt).toISOString(),
            notes: notes.trim() === "" ? null : notes,
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
    }

    return (
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
            <div>
                <p className="eyebrow">Editing</p>
                <h2 className="section-title mt-2">{workout.name}</h2>
            </div>

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
                    type="date"
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
