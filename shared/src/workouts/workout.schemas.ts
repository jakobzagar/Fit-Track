import {z} from "zod";

export const createWorkoutSchema = z.object({
    name: z.string().trim().min(1, "Workout name is required").max(100, "Workout name is too long"),
    performedAt: z.iso.datetime("Invalid workout date").optional(),
    notes: z.string().trim().max(1000, "Notes are too long").nullable().optional(),
});

export const updateWorkoutSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Workout name is required")
            .max(100, "Workout name is too long")
            .optional(),
        performedAt: z.iso.datetime("Invalid workout date").optional(),
        notes: z.string().trim().max(1000, "Notes are too long").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export const workoutIdSchema = z.object({
    workoutId: z.uuid("Invalid workout ID"),
});

export const workoutStatusSchema = z.enum(["DRAFT", "ACTIVE", "COMPLETED"]);

export const workoutSetSchema = z.object({
    id: z.uuid(),
    setNumber: z.number().int().positive(),
    reps: z.number().int().positive().nullable(),
    weight: z.coerce.number().nonnegative().nullable(),
    durationSeconds: z.number().int().positive().nullable(),
    completedAt: z.iso.datetime().nullable(),
    workoutExerciseId: z.uuid(),
});

export const workoutExerciseDetailsSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    muscleGroup: z.string(),
    equipment: z.string().nullable(),
});

export const workoutExerciseSchema = z.object({
    id: z.uuid(),
    position: z.number().int().positive(),
    notes: z.string().nullable(),
    workoutId: z.uuid(),
    exerciseId: z.uuid(),
    exercise: workoutExerciseDetailsSchema,
    sets: z.array(workoutSetSchema),
});

export const workoutBaseSchema = z.object({
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
});

export const workoutSummarySchema = workoutBaseSchema.extend({
    _count: z.object({
        workoutExercises: z.number().int().nonnegative(),
    }),
});

export const workoutSchema = workoutBaseSchema.extend({
    workoutExercises: z.array(workoutExerciseSchema),
});

export const workoutsResponseSchema = z.object({
    workouts: z.array(workoutSummarySchema),
});

export const workoutResponseSchema = z.object({
    workout: workoutSchema,
});

export const previousPerformanceSchema = z.object({
    exerciseId: z.uuid(),
    workoutId: z.uuid(),
    performedAt: z.iso.datetime(),
    sets: z.array(workoutSetSchema),
});

export const previousPerformancesResponseSchema = z.object({
    previousPerformances: z.array(previousPerformanceSchema),
});

export const createWorkoutResponseSchema = z.object({
    workout: workoutBaseSchema,
});

export const deleteWorkoutResponseSchema = z.object({
    message: z.string(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
export type WorkoutIdParams = z.infer<typeof workoutIdSchema>;
export type WorkoutStatus = z.infer<typeof workoutStatusSchema>;
export type WorkoutSet = z.infer<typeof workoutSetSchema>;
export type WorkoutExerciseDetails = z.infer<typeof workoutExerciseDetailsSchema>;
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;
export type WorkoutBase = z.infer<typeof workoutBaseSchema>;
export type WorkoutSummary = z.infer<typeof workoutSummarySchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutResponse = z.infer<typeof workoutResponseSchema>;
export type PreviousPerformance = z.infer<typeof previousPerformanceSchema>;
export type PreviousPerformancesResponse = z.infer<typeof previousPerformancesResponseSchema>;
export type CreateWorkoutResponse = z.infer<typeof createWorkoutResponseSchema>;
export type WorkoutsResponse = z.infer<typeof workoutsResponseSchema>;
