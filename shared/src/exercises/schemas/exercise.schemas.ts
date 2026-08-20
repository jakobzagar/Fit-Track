import {z} from "zod";

const exerciseNameSchema = z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long");
const muscleGroupSchema = z
    .string()
    .trim()
    .min(1, "Muscle group is required")
    .max(100, "Muscle group is too long");
const equipmentSchema = z
    .string()
    .trim()
    .min(1, "Equipment is required")
    .max(100, "Equipment is too long");

export const createExerciseSchema = z
    .object({
        name: exerciseNameSchema,
        muscleGroup: muscleGroupSchema,
        equipment: equipmentSchema.optional(),
    })
    .strict();

export const updateExerciseSchema = z
    .object({
        name: exerciseNameSchema.optional(),
        muscleGroup: muscleGroupSchema.optional(),
        equipment: equipmentSchema.nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export const exerciseIdSchema = z
    .object({
        exerciseId: z.uuid("Invalid exercise ID"),
    })
    .strict();

export const exerciseStatusSchema = z.enum(["active", "archived"]);

export const getExercisesQuerySchema = z
    .object({
        status: exerciseStatusSchema.default("active"),
    })
    .strict();

export const exerciseSchema = z
    .object({
        id: z.uuid(),
        name: z.string(),
        muscleGroup: z.string(),
        equipment: z.string().nullable(),
        isArchived: z.boolean(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
        userId: z.uuid(),
    })
    .strict();

export const exerciseResponseSchema = z
    .object({
        exercise: exerciseSchema,
    })
    .strict();

export const exercisesResponseSchema = z
    .object({
        exercises: z.array(exerciseSchema),
    })
    .strict();

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type ExerciseIdParams = z.infer<typeof exerciseIdSchema>;
export type ExerciseStatus = z.infer<typeof exerciseStatusSchema>;
export type GetExercisesQuery = z.infer<typeof getExercisesQuerySchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type ExerciseResponse = z.infer<typeof exerciseResponseSchema>;
export type ExercisesResponse = z.infer<typeof exercisesResponseSchema>;
