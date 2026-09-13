import {prisma} from "../../../db/prisma.js";
import {AppError} from "../../../common/errors/app.error.js";
import {normalizeExerciseName} from "../utils/exercise-name.js";
import type {
    CreateExerciseInput,
    GetExercisesQuery,
    UpdateExerciseInput,
} from "@fit-track/shared/exercises";

function isUniqueConstraintError(error: unknown): error is {code: string} {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function rethrowExerciseNameConflict(error: unknown): never {
    if (isUniqueConstraintError(error)) {
        throw new AppError("Exercise already exists", 409);
    }

    throw error;
}

export async function getExercisesService(userId: string, query: GetExercisesQuery) {
    return prisma.exercise.findMany({
        where: {
            userId,
            isArchived: query.status === "archived",
        },
        orderBy: {
            name: "asc",
        },
    });
}

export async function getExerciseByIdService(userId: string, exerciseId: string) {
    const exercise = await prisma.exercise.findFirst({
        where: {
            id: exerciseId,
            userId,
            isArchived: false,
        },
    });

    if (!exercise) {
        throw new AppError("Exercise not found", 404);
    }

    return exercise;
}

export async function createExerciseService(userId: string, data: CreateExerciseInput) {
    const normalizedName = normalizeExerciseName(data.name);
    const existingExercise = await prisma.exercise.findUnique({
        where: {
            userId_normalizedName: {
                userId,
                normalizedName,
            },
        },
    });

    if (existingExercise) {
        throw new AppError("Exercise already exists", 409);
    }

    return prisma.exercise
        .create({
            data: {
                name: data.name,
                normalizedName,
                muscleGroup: data.muscleGroup,
                equipment: data.equipment ?? null,
                userId,
            },
        })
        .catch(rethrowExerciseNameConflict);
}

export async function archiveExerciseService(userId: string, exerciseId: string) {
    const exercise = await prisma.exercise.findFirst({
        where: {
            id: exerciseId,
            userId,
            isArchived: false,
        },
    });

    if (!exercise) {
        throw new AppError("Exercise not found", 404);
    }

    return prisma.exercise.update({
        where: {
            id: exerciseId,
        },
        data: {
            isArchived: true,
        },
    });
}

export async function restoreExerciseService(userId: string, exerciseId: string) {
    const exercise = await prisma.exercise.findFirst({
        where: {
            id: exerciseId,
            userId,
            isArchived: true,
        },
    });

    if (!exercise) {
        throw new AppError("Archived exercise not found", 404);
    }

    return prisma.exercise.update({
        where: {
            id: exerciseId,
        },
        data: {
            isArchived: false,
        },
    });
}

export async function updateExerciseService(
    userId: string,
    exerciseId: string,
    data: UpdateExerciseInput,
) {
    const exercise = await prisma.exercise.findFirst({
        where: {
            id: exerciseId,
            userId,
            isArchived: false,
        },
    });

    if (!exercise) {
        throw new AppError("Exercise not found", 404);
    }

    if (data.name !== undefined) {
        const normalizedName = normalizeExerciseName(data.name);
        const existingExercise = await prisma.exercise.findUnique({
            where: {
                userId_normalizedName: {
                    userId,
                    normalizedName,
                },
            },
        });

        if (existingExercise && existingExercise.id !== exerciseId) {
            throw new AppError("Exercise already exists", 409);
        }
    }

    return prisma.exercise
        .update({
            where: {
                id: exerciseId,
            },
            data: {
                ...(data.name !== undefined && {
                    name: data.name,
                    normalizedName: normalizeExerciseName(data.name),
                }),
                ...(data.muscleGroup !== undefined && {muscleGroup: data.muscleGroup}),
                ...(data.equipment !== undefined && {equipment: data.equipment}),
            },
        })
        .catch(rethrowExerciseNameConflict);
}
