import {useState, type SubmitEvent} from "react";
import {z} from "zod";
import type {WorkoutSet} from "../../workouts/workout.types.ts";
import {
    updateWorkoutSetSchema,
    type UpdateWorkoutSetInput,
} from "../schemas/workout.exercises.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";

interface UpdateWorkoutSetFormProps {
    workoutSet: WorkoutSet;
    onSubmit: (data: UpdateWorkoutSetInput) => Promise<void>;
    onCancel: () => void;
}

interface UpdateWorkoutSetErrors {
    reps?: string;
    weight?: string;
    durationSeconds?: string;
    form?: string;
}

export function UpdateWorkoutSetForm({workoutSet, onSubmit, onCancel}: UpdateWorkoutSetFormProps) {
    const [reps, setReps] = useState(workoutSet.reps === null ? "" : String(workoutSet.reps));
    const [weight, setWeight] = useState(
        workoutSet.weight === null ? "" : String(workoutSet.weight),
    );
    const [durationSeconds, setDurationSeconds] = useState(
        workoutSet.durationSeconds === null ? "" : String(workoutSet.durationSeconds),
    );
    const [errors, setErrors] = useState<UpdateWorkoutSetErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        if (reps === "" && durationSeconds === "") {
            setErrors({
                form: "Either reps or durationSeconds is required",
            });
            return;
        }

        const result = updateWorkoutSetSchema.safeParse({
            reps: reps === "" ? null : Number(reps),
            weight: weight === "" ? null : Number(weight),
            durationSeconds: durationSeconds === "" ? null : Number(durationSeconds),
        });

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                reps: fieldErrors.reps?.[0],
                weight: fieldErrors.weight?.[0],
                durationSeconds: fieldErrors.durationSeconds?.[0],
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
        <form
            className="form-grid rounded-[12px] border border-line bg-ink p-4"
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
            {errors.reps && <p>{errors.reps}</p>}

            <label>
                Weight
                <input
                    type="number"
                    min="0"
                    max="999999.99"
                    step="0.01"
                    value={weight}
                    disabled={isSubmitting}
                    onChange={(event) => setWeight(event.target.value)}
                />
            </label>
            {errors.weight && <p>{errors.weight}</p>}

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
            {errors.durationSeconds && <p>{errors.durationSeconds}</p>}
            {errors.form && <p>{errors.form}</p>}

            <div className="button-row col-span-full">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save set"}
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
