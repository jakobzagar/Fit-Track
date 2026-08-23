import {z} from "zod";
import {
    createWorkoutSetSchema,
    updateWorkoutSetSchema,
    type CreateWorkoutSetInput,
    type UpdateWorkoutSetInput,
} from "@fit-track/shared/workout-exercises";

export interface WorkoutSetInputValues {
    reps: string;
    weight: string;
    durationSeconds: string;
}

export interface WorkoutSetInputErrors {
    reps?: string;
    weight?: string;
    durationSeconds?: string;
    form?: string;
}

type ParseResult<T> = {success: true; data: T} | {success: false; errors: WorkoutSetInputErrors};

function errorsFrom(error: z.ZodError): WorkoutSetInputErrors {
    const flattened = z.flattenError(error);
    const fieldErrors = flattened.fieldErrors as Partial<
        Record<keyof WorkoutSetInputValues, string[]>
    >;
    return {
        reps: fieldErrors.reps?.[0],
        weight: fieldErrors.weight?.[0],
        durationSeconds: fieldErrors.durationSeconds?.[0],
        form: flattened.formErrors[0],
    };
}

export function parseNewWorkoutSet(
    values: WorkoutSetInputValues,
): ParseResult<CreateWorkoutSetInput> {
    const result = createWorkoutSetSchema.safeParse({
        reps: values.reps === "" ? undefined : Number(values.reps),
        weight: values.weight === "" ? undefined : Number(values.weight),
        durationSeconds: values.durationSeconds === "" ? undefined : Number(values.durationSeconds),
    });

    return result.success
        ? {success: true, data: result.data}
        : {success: false, errors: errorsFrom(result.error)};
}

export function parseEditedWorkoutSet(
    values: WorkoutSetInputValues,
): ParseResult<UpdateWorkoutSetInput> {
    if (values.reps === "" && values.durationSeconds === "") {
        return {
            success: false,
            errors: {form: "Either reps or durationSeconds is required"},
        };
    }

    const result = updateWorkoutSetSchema.safeParse({
        reps: values.reps === "" ? null : Number(values.reps),
        weight: values.weight === "" ? null : Number(values.weight),
        durationSeconds: values.durationSeconds === "" ? null : Number(values.durationSeconds),
    });

    return result.success
        ? {success: true, data: result.data}
        : {success: false, errors: errorsFrom(result.error)};
}
