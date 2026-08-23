import {z} from "zod";
import {useId, useRef, useState, type SubmitEvent} from "react";
import {createExerciseSchema, type CreateExerciseInput} from "@fit-track/shared/exercises";
import {Button} from "../../../../components/ui/actions/Button";
import {FieldError} from "../../../../components/ui/forms/FieldError";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../../components/ui/forms/utils/formAccessibility";
import {apiValidationErrors} from "../../../../components/ui/forms/utils/apiValidationErrors";

interface CreateExerciseFormProps {
    onSubmit: (data: CreateExerciseInput) => Promise<void>;
}

interface CreateExerciseErrors {
    name?: string;
    muscleGroup?: string;
    equipment?: string;
}

export function CreateExerciseForm({onSubmit}: CreateExerciseFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
    const [name, setName] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");
    const [equipment, setEquipment] = useState("");

    const [errors, setErrors] = useState<CreateExerciseErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = createExerciseSchema.safeParse({
            name,
            muscleGroup,
            equipment: equipment.trim() === "" ? undefined : equipment,
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
        } catch (error) {
            const serverErrors = apiValidationErrors(error);
            if (serverErrors) {
                setErrors(serverErrors);
                focusFirstInvalidField(formRef);
            }
            return;
        } finally {
            setIsSubmitting(false);
        }

        setName("");
        setMuscleGroup("");
        setEquipment("");
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

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create exercise"}
            </Button>
        </form>
    );
}
