import {z} from "zod";
import {messageResponseSchema} from "../../common/schemas/response.schemas.js";
import {workoutExerciseSchema} from "./workout-exercise.schemas.js";
import {workoutSetSchema} from "./workout-set.schemas.js";

const workoutNameSchema = z
    .string()
    .trim()
    .min(1, "Workout name is required")
    .max(100, "Workout name is too long");
const workoutDateSchema = z.iso.date("Invalid workout date");
const workoutNotesSchema = z.string().trim().max(1000, "Notes are too long").nullable();

export const createWorkoutSchema = z
    .object({
        name: workoutNameSchema,
        performedAt: workoutDateSchema.optional(),
        notes: workoutNotesSchema.optional(),
    })
    .strict();

export const updateWorkoutSchema = z
    .object({
        name: workoutNameSchema.optional(),
        performedAt: workoutDateSchema.optional(),
        notes: workoutNotesSchema.optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export const workoutIdSchema = z
    .object({
        workoutId: z.uuid("Invalid workout ID"),
    })
    .strict();

export const workoutStatusSchema = z.enum(["DRAFT", "ACTIVE", "COMPLETED"]);

export const workoutRecordSchema = z
    .object({
        id: z.uuid(),
        name: z.string(),
        status: workoutStatusSchema,
        startedAt: z.iso.datetime().nullable(),
        completedAt: z.iso.datetime().nullable(),
        performedAt: z.iso.datetime(),
        notes: z.string().nullable(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
        userId: z.uuid(),
    })
    .strict();

export const workoutSummarySchema = workoutRecordSchema.extend({
    _count: z
        .object({
            workoutExercises: z.number().int().nonnegative(),
        })
        .strict(),
});

export const workoutSchema = workoutRecordSchema.extend({
    workoutExercises: z.array(workoutExerciseSchema),
});

export const workoutsResponseSchema = z
    .object({
        workouts: z.array(workoutSummarySchema),
    })
    .strict();

export const workoutResponseSchema = z
    .object({
        workout: workoutSchema,
    })
    .strict();

export const previousPerformanceSchema = z
    .object({
        exerciseId: z.uuid(),
        workoutId: z.uuid(),
        performedAt: z.iso.datetime(),
        sets: z.array(workoutSetSchema),
    })
    .strict();

export const previousPerformancesResponseSchema = z
    .object({
        previousPerformances: z.array(previousPerformanceSchema),
    })
    .strict();

export const workoutRecordResponseSchema = z
    .object({
        workout: workoutRecordSchema,
    })
    .strict();

export const deleteWorkoutResponseSchema = messageResponseSchema;

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
export type WorkoutIdParams = z.infer<typeof workoutIdSchema>;
export type WorkoutStatus = z.infer<typeof workoutStatusSchema>;
export type WorkoutRecord = z.infer<typeof workoutRecordSchema>;
export type WorkoutSummary = z.infer<typeof workoutSummarySchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutResponse = z.infer<typeof workoutResponseSchema>;
export type PreviousPerformance = z.infer<typeof previousPerformanceSchema>;
export type PreviousPerformancesResponse = z.infer<typeof previousPerformancesResponseSchema>;
export type WorkoutRecordResponse = z.infer<typeof workoutRecordResponseSchema>;
export type DeleteWorkoutResponse = z.infer<typeof deleteWorkoutResponseSchema>;
export type WorkoutsResponse = z.infer<typeof workoutsResponseSchema>;
