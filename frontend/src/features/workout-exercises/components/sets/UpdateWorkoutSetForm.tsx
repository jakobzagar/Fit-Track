import {useId, useRef, useState, type SubmitEvent} from "react";
import type {WorkoutSet} from "../../../workouts/types/workout.types.ts";
import type {UpdateWorkoutSetInput} from "../../schemas/workout-exercises.schemas.ts";
import {parseEditedWorkoutSet} from "../../schemas/workout-set-input.parser.ts";
import {Button} from "../../../../components/ui/actions/Button.tsx";
import {FieldError} from "../../../../components/ui/forms/FieldError.tsx";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../../components/ui/forms/utils/formAccessibility.ts";

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
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
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

        const result = parseEditedWorkoutSet({reps, weight, durationSeconds});

        if (!result.success) {
            setErrors(result.errors);
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
                    {...invalidFieldProps(
                        errors.reps ?? errors.form,
                        `${id}-${errors.reps ? "reps" : "form"}-error`,
                    )}
                    onChange={(event) => setReps(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-reps-error`}>{errors.reps}</FieldError>

            <label>
                Weight
                <input
                    type="number"
                    min="0"
                    max="999999.99"
                    step="0.01"
                    value={weight}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.weight, `${id}-weight-error`)}
                    onChange={(event) => setWeight(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-weight-error`}>{errors.weight}</FieldError>

            <label>
                Duration in seconds
                <input
                    type="number"
                    min="1"
                    value={durationSeconds}
                    disabled={isSubmitting}
                    {...invalidFieldProps(
                        errors.durationSeconds ?? errors.form,
                        `${id}-${errors.durationSeconds ? "duration" : "form"}-error`,
                    )}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-duration-error`}>{errors.durationSeconds}</FieldError>
            <FieldError id={`${id}-form-error`}>{errors.form}</FieldError>

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
