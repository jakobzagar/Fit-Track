import {useState, type SubmitEvent} from "react";
import {z} from "zod";
import {
    createWorkoutSetSchema,
    type CreateWorkoutSetInput,
} from "../schemas/workout.exercises.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";

interface AddWorkoutSetFormProps {
    onSubmit: (data: CreateWorkoutSetInput) => Promise<void>;
}

interface AddWorkoutSetErrors {
    reps?: string;
    weight?: string;
    durationSeconds?: string;
    form?: string;
}

export function AddWorkoutSetForm({onSubmit}: AddWorkoutSetFormProps) {
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");
    const [durationSeconds, setDurationSeconds] = useState("");
    const [errors, setErrors] = useState<AddWorkoutSetErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = createWorkoutSetSchema.safeParse({
            reps: reps === "" ? undefined : Number(reps),
            weight: weight === "" ? undefined : Number(weight),
            durationSeconds: durationSeconds === "" ? undefined : Number(durationSeconds),
        });

        if (!result.success) {
            const flattenedError = z.flattenError(result.error);

            setErrors({
                reps: flattenedError.fieldErrors.reps?.[0],
                weight: flattenedError.fieldErrors.weight?.[0],
                durationSeconds: flattenedError.fieldErrors.durationSeconds?.[0],
                form: flattenedError.formErrors[0],
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

        setReps("");
        setWeight("");
        setDurationSeconds("");
    }

    return (
        <form
            className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
            onSubmit={handleSubmit}
            noValidate
        >
            <label>
                Reps
                <input
                    type="number"
                    min="1"
                    value={reps}
                    disabled={isSubmitting}
                    onChange={(event) => setReps(event.target.value)}
                />
            </label>

            <label>
                Weight
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={weight}
                    disabled={isSubmitting}
                    onChange={(event) => setWeight(event.target.value)}
                />
            </label>

            <label>
                Duration in seconds
                <input
                    type="number"
                    min="1"
                    value={durationSeconds}
                    disabled={isSubmitting}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                />
            </label>

            <Button className="h-12 self-end" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add set"}
            </Button>
            {(errors.reps || errors.weight || errors.durationSeconds || errors.form) && (
                <p className="col-span-full text-xs text-negative">
                    {errors.reps || errors.weight || errors.durationSeconds || errors.form}
                </p>
            )}
        </form>
    );
}
