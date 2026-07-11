import {prisma} from "../../db/prisma.js";
import {AppError} from "../../common/errors/app.error.js";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "./workout.schema.js";

export async function getWorkoutsService(userId: string) {
    return prisma.workout.findMany({
        where: {
            userId,
        },
        orderBy: {
            performedAt: "desc",
        },
        include: {
            _count: {
                select: {
                    workoutExercises: true,
                },
            },
        },
    });
}

export async function getWorkoutByIdService(userId: string, workoutId: string) {
    const workout = await prisma.workout.findFirst({
        where: {
            id: workoutId,
            userId,
        },
        include: {
            workoutExercises: {
                orderBy: {
                    position: "asc",
                },
                include: {
                    exercise: {
                        select: {
                            id: true,
                            name: true,
                            muscleGroup: true,
                            equipment: true,
                        },
                    },
                    sets: {
                        orderBy: {
                            setNumber: "asc",
                        },
                    },
                },
            },
        },
    });

    if (!workout) {
        throw new AppError("Workout not found", 404);
    }

    return workout;
}

export async function createWorkoutService(userId: string, data: CreateWorkoutInput) {
    return prisma.workout.create({
        data: {
            name: data.name,
            userId,

            ...(data.notes !== undefined && {
                notes: data.notes,
            }),

            ...(data.performedAt !== undefined && {
                performedAt: new Date(data.performedAt),
            }),
        },
    });
}

export async function deleteWorkoutByIdService(userId: string, workoutId: string) {
    const workout = await prisma.workout.findFirst({
        where: {
            id: workoutId,
            userId,
        },
    });

    if (!workout) {
        throw new AppError("Workout not found", 404);
    }

    return prisma.workout.delete({
        where: {
            id: workoutId,
        },
    });
}

export async function updateWorkoutByIdService(
    userId: string,
    workoutId: string,
    data: UpdateWorkoutInput,
) {
    const workout = await prisma.workout.findFirst({
        where: {
            id: workoutId,
            userId,
        },
    });

    if (!workout) {
        throw new AppError("Workout not found", 404);
    }

    return prisma.workout.update({
        where: {
            id: workoutId,
        },
        data: {
            ...(data.name !== undefined && {name: data.name}),
            ...(data.performedAt !== undefined && {performedAt: new Date(data.performedAt)}),
            ...(data.notes !== undefined && {notes: data.notes}),
        },
    });
}
