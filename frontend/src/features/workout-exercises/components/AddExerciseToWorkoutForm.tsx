import {useState, type SubmitEvent} from "react";
import {z} from "zod";
import type {Exercise} from "../../exercises/exercise.types.ts";
import {
    addExerciseToWorkoutSchema,
    type AddExerciseToWorkoutInput,
} from "../schemas/workout.exercises.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";

interface AddExerciseToWorkoutFormProps {
    exercises: Exercise[];
    onSubmit: (data: AddExerciseToWorkoutInput) => Promise<void>;
}

interface AddExerciseToWorkoutErrors {
    exerciseId?: string;
    notes?: string;
}

export function AddExerciseToWorkoutForm({exercises, onSubmit}: AddExerciseToWorkoutFormProps) {
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

        setExerciseId("");
        setNotes("");
    }

    if (exercises.length === 0) {
        return (
            <p className="text-sm text-dim">Every available exercise is already in this workout.</p>
        );
    }

    return (
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <label>
                Exercise
                <select
                    value={exerciseId}
                    disabled={isSubmitting}
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
            {errors.exerciseId && <p>{errors.exerciseId}</p>}

            <label>
                Notes
                <textarea
                    value={notes}
                    disabled={isSubmitting}
                    onChange={(event) => setNotes(event.target.value)}
                />
            </label>
            {errors.notes && <p>{errors.notes}</p>}

            <Button className="self-end" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add exercise"}
            </Button>
        </form>
    );
}
