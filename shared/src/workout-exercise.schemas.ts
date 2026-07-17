import {z} from "zod";
import {workoutExerciseSchema, workoutSetSchema} from "./workout.schemas.js";

export const addExerciseToWorkoutSchema = z.object({
    exerciseId: z.uuid("Invalid exercise ID"),
    notes: z.string().trim().max(1000, "Notes are too long").nullable().optional(),
});

export const createWorkoutSetSchema = z
    .object({
        reps: z
            .number()
            .int("Reps must be an integer")
            .positive("Reps must be greater than zero")
            .optional(),
        weight: z
            .number()
            .nonnegative("Weight cannot be negative")
            .max(999999.99, "Weight is too large")
            .multipleOf(0.01, "Weight can have at most two decimal places")
            .optional(),
        durationSeconds: z
            .number()
            .int("Duration must be an integer")
            .positive("Duration must be greater than zero")
            .optional(),
    })
    .refine((data) => data.reps !== undefined || data.durationSeconds !== undefined, {
        message: "Either reps or durationSeconds is required",
    });

export const updateWorkoutExerciseSchema = z
    .object({
        position: z.number().int().positive("Position must be greater than zero").optional(),
        notes: z.string().trim().max(1000, "Notes are too long").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

const workoutSetValuesSchema = z.object({
    reps: z
        .number()
        .int("Reps must be an integer")
        .positive("Reps must be greater than zero")
        .nullable()
        .optional(),
    weight: z
        .number()
        .nonnegative("Weight cannot be negative")
        .max(999999.99, "Weight is too large")
        .multipleOf(0.01, "Weight can have at most two decimal places")
        .nullable()
        .optional(),
    durationSeconds: z
        .number()
        .int("Duration must be an integer")
        .positive("Duration must be greater than zero")
        .nullable()
        .optional(),
});

export const updateWorkoutSetSchema = workoutSetValuesSchema
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export const setWorkoutSetCompletionSchema = workoutSetValuesSchema.extend({
    completed: z.boolean(),
});

export const workoutSetParamsSchema = z.object({
    workoutId: z.uuid("Invalid workout ID"),
    workoutExerciseId: z.uuid("Invalid workout exercise ID"),
});

export const workoutSetIdParamsSchema = workoutSetParamsSchema.extend({
    setId: z.uuid("Invalid set ID"),
});

export const addExerciseToWorkoutResponseSchema = z.object({
    workoutExercise: workoutExerciseSchema.omit({sets: true}),
});

export const addSetToWorkoutExerciseResponseSchema = z.object({
    workoutExerciseSet: workoutSetSchema,
});

export const workoutExerciseResponseSchema = z.object({
    workoutExercise: workoutExerciseSchema,
});

export const workoutSetResponseSchema = z.object({
    workoutExerciseSet: workoutSetSchema,
});

export const deleteWorkoutExerciseResponseSchema = z.object({
    message: z.string(),
});

export const deleteWorkoutSetResponseSchema = z.object({
    message: z.string(),
});

export type AddExerciseToWorkoutInput = z.infer<typeof addExerciseToWorkoutSchema>;
export type CreateWorkoutSetInput = z.infer<typeof createWorkoutSetSchema>;
export type UpdateWorkoutExerciseInput = z.infer<typeof updateWorkoutExerciseSchema>;
export type UpdateWorkoutSetInput = z.infer<typeof updateWorkoutSetSchema>;
export type SetWorkoutSetCompletionInput = z.infer<typeof setWorkoutSetCompletionSchema>;
export type WorkoutSetParams = z.infer<typeof workoutSetParamsSchema>;
export type WorkoutSetIdParams = z.infer<typeof workoutSetIdParamsSchema>;
export type AddExerciseToWorkoutResponse = z.infer<typeof addExerciseToWorkoutResponseSchema>;
export type AddSetToWorkoutExerciseResponse = z.infer<typeof addSetToWorkoutExerciseResponseSchema>;
export type WorkoutExerciseResponse = z.infer<typeof workoutExerciseResponseSchema>;
export type WorkoutSetResponse = z.infer<typeof workoutSetResponseSchema>;
export type DeleteWorkoutExerciseResponse = z.infer<typeof deleteWorkoutExerciseResponseSchema>;
export type DeleteWorkoutSetResponse = z.infer<typeof deleteWorkoutSetResponseSchema>;
