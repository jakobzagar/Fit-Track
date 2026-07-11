import {prisma} from "../../db/prisma.js";
import {AppError} from "../../common/errors/app.error.js";
import type {
    CreateExerciseInput,
    GetExercisesQuery,
    UpdateExerciseInput,
} from "./exercise.schema.js";

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
    const existingExercise = await prisma.exercise.findUnique({
        where: {
            userId_name: {
                userId,
                name: data.name,
            },
        },
    });

    if (existingExercise) {
        throw new AppError("Exercise already exists", 409);
    }

    return prisma.exercise.create({
        data: {
            name: data.name,
            muscleGroup: data.muscleGroup,
            equipment: data.equipment ?? null,
            userId,
        },
    });
}

export async function deleteExerciseByIdService(userId: string, exerciseId: string) {
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

export async function restoreExerciseByIdService(userId: string, exerciseId: string) {
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

export async function updateExerciseByIdService(
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
        const existingExercise = await prisma.exercise.findUnique({
            where: {
                userId_name: {
                    userId,
                    name: data.name,
                },
            },
        });

        if (existingExercise && existingExercise.id !== exerciseId) {
            throw new AppError("Exercise already exists", 409);
        }
    }

    return prisma.exercise.update({
        where: {
            id: exerciseId,
        },
        data: {
            ...(data.name !== undefined && {name: data.name}),
            ...(data.muscleGroup !== undefined && {muscleGroup: data.muscleGroup}),
            ...(data.equipment !== undefined && {equipment: data.equipment}),
        },
    });
}
