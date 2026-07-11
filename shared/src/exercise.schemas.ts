import {z} from "zod";

export const createExerciseSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    muscleGroup: z.string().trim().min(1, "Muscle group is required"),
    equipment: z.string().trim().min(1, "Equipment is required").optional(),
});

export const updateExerciseSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").optional(),
        muscleGroup: z.string().trim().min(1, "Muscle group is required").optional(),
        equipment: z.string().trim().min(1, "Equipment is required").nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export const exerciseIdSchema = z.object({
    exerciseId: z.uuid("Invalid exercise ID"),
});

export const getExercisesQuerySchema = z.object({
    status: z.enum(["active", "archived"]).default("active"),
});

export const exerciseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    muscleGroup: z.string(),
    equipment: z.string().nullable(),
    isArchived: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    userId: z.uuid(),
});

export const exerciseResponseSchema = z.object({
    exercise: exerciseSchema,
});

export const exercisesResponseSchema = z.object({
    exercises: z.array(exerciseSchema),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseIdParams = z.infer<typeof exerciseIdSchema>;
export type GetExercisesQuery = z.infer<typeof getExercisesQuerySchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type ExerciseResponse = z.infer<typeof exerciseResponseSchema>;
export type ExercisesResponse = z.infer<typeof exercisesResponseSchema>;
