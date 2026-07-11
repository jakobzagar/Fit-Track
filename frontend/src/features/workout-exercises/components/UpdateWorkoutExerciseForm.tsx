import {useState, type SubmitEvent} from "react";
import {z} from "zod";
import type {WorkoutExercise} from "../../workouts/workout.types.ts";
import {
    updateWorkoutExerciseSchema,
    type UpdateWorkoutExerciseInput,
} from "../schemas/workout.exercises.schemas.ts";

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
        <form onSubmit={handleSubmit} noValidate>
            <label>
                Position
                <input
                    type="number"
                    min="1"
                    value={position}
                    disabled={isSubmitting}
                    onChange={(event) => setPosition(event.target.value)}
                />
            </label>
            {errors.position && <p>{errors.position}</p>}

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
                {isSubmitting ? "Saving..." : "Save exercise"}
            </button>
            <button type="button" disabled={isSubmitting} onClick={onCancel}>
                Cancel
            </button>
        </form>
    );
}
