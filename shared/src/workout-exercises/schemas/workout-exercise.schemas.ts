import {z} from "zod";
import {messageResponseSchema} from "../../common/schemas/response.schemas.js";
import {workoutExerciseSchema, workoutSetSchema} from "../../workouts/schemas/workout.schemas.js";

const workoutExerciseNotesSchema = z.string().trim().max(1000, "Notes are too long").nullable();
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

export const addExerciseToWorkoutSchema = z
    .object({
        exerciseId: z.uuid("Invalid exercise ID"),
        notes: workoutExerciseNotesSchema.optional(),
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

export const updateWorkoutExerciseSchema = z
    .object({
        position: z.number().int().positive("Position must be greater than zero").optional(),
        notes: workoutExerciseNotesSchema.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
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

export const workoutExerciseParamsSchema = z
    .object({
        workoutId: z.uuid("Invalid workout ID"),
        workoutExerciseId: z.uuid("Invalid workout exercise ID"),
    })
    .strict();

export const workoutSetIdParamsSchema = workoutExerciseParamsSchema.extend({
    setId: z.uuid("Invalid set ID"),
});

export const addExerciseToWorkoutResponseSchema = z
    .object({
        workoutExercise: workoutExerciseSchema.omit({sets: true}),
    })
    .strict();

export const workoutSetResponseSchema = z
    .object({
        workoutExerciseSet: workoutSetSchema,
    })
    .strict();

export const addSetToWorkoutExerciseResponseSchema = workoutSetResponseSchema;

export const workoutExerciseResponseSchema = z
    .object({
        workoutExercise: workoutExerciseSchema,
    })
    .strict();

export const deleteWorkoutExerciseResponseSchema = messageResponseSchema;

export const deleteWorkoutSetResponseSchema = messageResponseSchema;

export type AddExerciseToWorkoutInput = z.infer<typeof addExerciseToWorkoutSchema>;
export type CreateWorkoutSetInput = z.infer<typeof createWorkoutSetSchema>;
export type UpdateWorkoutExerciseInput = z.infer<typeof updateWorkoutExerciseSchema>;
export type UpdateWorkoutSetInput = z.infer<typeof updateWorkoutSetSchema>;
export type SetWorkoutSetCompletionInput = z.infer<typeof setWorkoutSetCompletionSchema>;
export type WorkoutExerciseParams = z.infer<typeof workoutExerciseParamsSchema>;
export type WorkoutSetIdParams = z.infer<typeof workoutSetIdParamsSchema>;
export type AddExerciseToWorkoutResponse = z.infer<typeof addExerciseToWorkoutResponseSchema>;
export type AddSetToWorkoutExerciseResponse = z.infer<typeof addSetToWorkoutExerciseResponseSchema>;
export type WorkoutExerciseResponse = z.infer<typeof workoutExerciseResponseSchema>;
export type WorkoutSetResponse = z.infer<typeof workoutSetResponseSchema>;
export type DeleteWorkoutExerciseResponse = z.infer<typeof deleteWorkoutExerciseResponseSchema>;
export type DeleteWorkoutSetResponse = z.infer<typeof deleteWorkoutSetResponseSchema>;
