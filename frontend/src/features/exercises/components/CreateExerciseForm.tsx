import {z} from "zod";
import {useState, type SubmitEvent} from "react";
import {createExerciseSchema, type CreateExerciseInput} from "../schemas/exercise.schemas";

interface CreateExerciseFormProps {
    onSubmit: (data: CreateExerciseInput) => Promise<void>;
}

interface CreateExerciseErrors {
    name?: string;
    muscleGroup?: string;
    equipment?: string;
}

export function CreateExerciseForm({onSubmit}: CreateExerciseFormProps) {
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
        setMuscleGroup("");
        setEquipment("");
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
                Muscle group
                <input
                    value={muscleGroup}
                    disabled={isSubmitting}
                    onChange={(event) => setMuscleGroup(event.target.value)}
                />
            </label>
            {errors.muscleGroup && <p>{errors.muscleGroup}</p>}

            <label>
                Equipment
                <input
                    value={equipment}
                    disabled={isSubmitting}
                    onChange={(event) => setEquipment(event.target.value)}
                />
            </label>
            {errors.equipment && <p>{errors.equipment}</p>}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create exercise"}
            </button>
        </form>
    );
}
