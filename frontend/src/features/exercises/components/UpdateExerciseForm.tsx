import {z} from "zod";
import {useId, useRef, useState, type SubmitEvent} from "react";
import {updateExerciseSchema, type UpdateExerciseInput} from "../schemas/exercise.schemas";
import type {Exercise} from "../exercise.types.ts";
import {Button} from "../../../components/ui/Button";
import {FieldError} from "../../../components/ui/FieldError";
import {focusFirstInvalidField, invalidFieldProps} from "../../../components/ui/formAccessibility";

interface UpdateExerciseFormProps {
    exercise: Exercise;
    onSubmit: (data: UpdateExerciseInput) => Promise<void>;
    onCancel: () => void;
}

interface EditExerciseErrors {
    name?: string;
    muscleGroup?: string;
    equipment?: string;
}

export const UpdateExerciseForm = ({exercise, onSubmit, onCancel}: UpdateExerciseFormProps) => {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
    const [name, setName] = useState(exercise.name);
    const [muscleGroup, setMuscleGroup] = useState(exercise.muscleGroup);
    const [equipment, setEquipment] = useState(exercise.equipment ?? "");
    const [errors, setErrors] = useState<EditExerciseErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        const result = updateExerciseSchema.safeParse({
            name,
            muscleGroup,
            equipment: equipment.trim() === "" ? null : equipment,
        });

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                name: fieldErrors.name?.[0],
                muscleGroup: fieldErrors.muscleGroup?.[0],
                equipment: fieldErrors.equipment?.[0],
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
                <h2 className="section-title mt-2">{exercise.name}</h2>
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
                Muscle group
                <input
                    value={muscleGroup}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.muscleGroup, `${id}-muscle-group-error`)}
                    onChange={(event) => setMuscleGroup(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-muscle-group-error`}>{errors.muscleGroup}</FieldError>

            <label>
                Equipment
                <input
                    value={equipment}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.equipment, `${id}-equipment-error`)}
                    onChange={(event) => setEquipment(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-equipment-error`}>{errors.equipment}</FieldError>

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
};
