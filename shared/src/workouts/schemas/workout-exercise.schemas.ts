import {z} from "zod";
import {messageResponseSchema} from "../../common/schemas/response.schemas.js";
import {exerciseSummarySchema} from "../../exercises/schemas/exercise.schemas.js";
import {workoutSetSchema} from "./workout-set.schemas.js";

const workoutExerciseNotesSchema = z.string().trim().max(1000, "Notes are too long").nullable();

export const workoutExerciseSchema = z
    .object({
        id: z.uuid(),
        position: z.number().int().positive(),
        notes: z.string().nullable(),
        workoutId: z.uuid(),
        exerciseId: z.uuid(),
        exercise: exerciseSummarySchema,
        sets: z.array(workoutSetSchema),
    })
    .strict();

export const addExerciseToWorkoutSchema = z
    .object({
        exerciseId: z.uuid("Invalid exercise ID"),
        notes: workoutExerciseNotesSchema.optional(),
    })
    .strict();

export const updateWorkoutExerciseSchema = z
    .object({
        position: z.number().int().positive("Position must be greater than zero").optional(),
        notes: workoutExerciseNotesSchema.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export const workoutExerciseParamsSchema = z
    .object({
        workoutId: z.uuid("Invalid workout ID"),
        workoutExerciseId: z.uuid("Invalid workout exercise ID"),
    })
    .strict();

export const workoutSetIdParamsSchema = workoutExerciseParamsSchema.extend({
    workoutSetId: z.uuid("Invalid workout set ID"),
});

export const addExerciseToWorkoutResponseSchema = z
    .object({
        workoutExercise: workoutExerciseSchema.omit({sets: true}),
    })
    .strict();

export const workoutExerciseResponseSchema = z
    .object({
        workoutExercise: workoutExerciseSchema,
    })
    .strict();

export const deleteWorkoutExerciseResponseSchema = messageResponseSchema;

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;
export type AddExerciseToWorkoutInput = z.infer<typeof addExerciseToWorkoutSchema>;
export type UpdateWorkoutExerciseInput = z.infer<typeof updateWorkoutExerciseSchema>;
export type WorkoutExerciseParams = z.infer<typeof workoutExerciseParamsSchema>;
export type WorkoutSetIdParams = z.infer<typeof workoutSetIdParamsSchema>;
export type AddExerciseToWorkoutResponse = z.infer<typeof addExerciseToWorkoutResponseSchema>;
export type WorkoutExerciseResponse = z.infer<typeof workoutExerciseResponseSchema>;
export type DeleteWorkoutExerciseResponse = z.infer<typeof deleteWorkoutExerciseResponseSchema>;
