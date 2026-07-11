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

export const workoutSetParamsSchema = z.object({
    workoutId: z.uuid("Invalid workout ID"),
    workoutExerciseId: z.uuid("Invalid workout exercise ID"),
});

export const addExerciseToWorkoutResponseSchema = z.object({
    workoutExercise: workoutExerciseSchema.omit({sets: true}),
});

export const addSetToWorkoutExerciseResponseSchema = z.object({
    workoutExerciseSet: workoutSetSchema,
});

export type AddExerciseToWorkoutInput = z.infer<typeof addExerciseToWorkoutSchema>;
export type CreateWorkoutSetInput = z.infer<typeof createWorkoutSetSchema>;
export type WorkoutSetParams = z.infer<typeof workoutSetParamsSchema>;
export type AddExerciseToWorkoutResponse = z.infer<typeof addExerciseToWorkoutResponseSchema>;
export type AddSetToWorkoutExerciseResponse = z.infer<typeof addSetToWorkoutExerciseResponseSchema>;
