import {z} from "zod";
import {messageResponseSchema} from "../../common/schemas/response.schemas.js";

const workoutSetWeightSchema = z.number().nonnegative().max(999999.99).multipleOf(0.01);

const serializedWorkoutSetWeightSchema = z.union([
    workoutSetWeightSchema,
    z
        .string()
        .regex(/^\d+(?:\.\d{1,2})?$/, "Invalid serialized weight")
        .transform(Number)
        .pipe(workoutSetWeightSchema),
]);

const workoutSetRepsSchema = z
    .number()
    .int("Reps must be an integer")
    .positive("Reps must be greater than zero");

const workoutSetWeightInputSchema = z
    .number()
    .nonnegative("Weight cannot be negative")
    .max(999999.99, "Weight is too large")
    .multipleOf(0.01, "Weight can have at most two decimal places");

const workoutSetDurationSchema = z
    .number()
    .int("Duration must be an integer")
    .positive("Duration must be greater than zero");

export const workoutSetSchema = z
    .object({
        id: z.uuid(),
        setNumber: z.number().int().positive(),
        reps: z.number().int().positive().nullable(),
        weight: serializedWorkoutSetWeightSchema.nullable(),
        durationSeconds: z.number().int().positive().nullable(),
        completedAt: z.iso.datetime().nullable(),
        workoutExerciseId: z.uuid(),
    })
    .strict();

export const createWorkoutSetSchema = z
    .object({
        reps: workoutSetRepsSchema.optional(),
        weight: workoutSetWeightInputSchema.optional(),
        durationSeconds: workoutSetDurationSchema.optional(),
    })
    .strict()
    .refine((data) => data.reps !== undefined || data.durationSeconds !== undefined, {
        message: "Either reps or durationSeconds is required",
    });

const workoutSetValuesSchema = z
    .object({
        reps: workoutSetRepsSchema.nullable().optional(),
        weight: workoutSetWeightInputSchema.nullable().optional(),
        durationSeconds: workoutSetDurationSchema.nullable().optional(),
    })
    .strict();

export const updateWorkoutSetSchema = workoutSetValuesSchema.refine(
    (data) => Object.keys(data).length > 0,
    {
        message: "At least one field is required",
    },
);

export const setWorkoutSetCompletionSchema = workoutSetValuesSchema.extend({
    completed: z.boolean(),
});

export const workoutSetResponseSchema = z
    .object({
        workoutSet: workoutSetSchema,
    })
    .strict();

export const addSetToWorkoutExerciseResponseSchema = workoutSetResponseSchema;
export const deleteWorkoutSetResponseSchema = messageResponseSchema;

export type WorkoutSet = z.infer<typeof workoutSetSchema>;
export type CreateWorkoutSetInput = z.infer<typeof createWorkoutSetSchema>;
export type UpdateWorkoutSetInput = z.infer<typeof updateWorkoutSetSchema>;
export type SetWorkoutSetCompletionInput = z.infer<typeof setWorkoutSetCompletionSchema>;
export type AddSetToWorkoutExerciseResponse = z.infer<typeof addSetToWorkoutExerciseResponseSchema>;
export type WorkoutSetResponse = z.infer<typeof workoutSetResponseSchema>;
export type DeleteWorkoutSetResponse = z.infer<typeof deleteWorkoutSetResponseSchema>;
