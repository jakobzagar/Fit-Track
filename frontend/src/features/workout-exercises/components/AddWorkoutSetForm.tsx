import {useId, useRef, useState, type SubmitEvent} from "react";
import {z} from "zod";
import {
    createWorkoutSetSchema,
    type CreateWorkoutSetInput,
} from "../schemas/workout.exercises.schemas.ts";
import {Button} from "../../../components/ui/Button.tsx";
import {FieldError} from "../../../components/ui/FieldError.tsx";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../components/ui/formAccessibility.ts";

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
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
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

        setReps("");
        setWeight("");
        setDurationSeconds("");
    }

    return (
        <form
            ref={formRef}
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
                    {...invalidFieldProps(
                        errors.reps ?? errors.form,
                        `${id}-${errors.reps ? "reps" : "form"}-error`,
                    )}
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
                    {...invalidFieldProps(errors.weight, `${id}-weight-error`)}
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
                    {...invalidFieldProps(
                        errors.durationSeconds ?? errors.form,
                        `${id}-${errors.durationSeconds ? "duration" : "form"}-error`,
                    )}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                />
            </label>

            <Button className="h-12 self-end" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add set"}
            </Button>
            <div className="col-span-full">
                <FieldError id={`${id}-reps-error`}>{errors.reps}</FieldError>
                <FieldError id={`${id}-weight-error`}>{errors.weight}</FieldError>
                <FieldError id={`${id}-duration-error`}>{errors.durationSeconds}</FieldError>
                <FieldError id={`${id}-form-error`}>{errors.form}</FieldError>
            </div>
        </form>
    );
}
