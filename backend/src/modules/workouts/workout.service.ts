import {prisma} from "../../db/prisma.js";
import {AppError} from "../../common/errors/app.error.js";
import {runSerializableTransaction} from "../../db/transaction.js";
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

export async function getPreviousPerformancesService(userId: string, workoutId: string) {
    const workout = await prisma.workout.findFirst({
        where: {
            id: workoutId,
            userId,
        },
        select: {
            workoutExercises: {
                select: {
                    exerciseId: true,
                },
            },
        },
    });

    if (!workout) {
        throw new AppError("Workout not found", 404);
    }

    const previousPerformances = await Promise.all(
        workout.workoutExercises.map(async ({exerciseId}) => {
            const previousWorkoutExercise = await prisma.workoutExercise.findFirst({
                where: {
                    exerciseId,
                    workoutId: {
                        not: workoutId,
                    },
                    workout: {
                        userId,
                        status: "COMPLETED",
                    },
                    sets: {
                        some: {
                            completedAt: {
                                not: null,
                            },
                        },
                    },
                },
                orderBy: {
                    workout: {
                        completedAt: "desc",
                    },
                },
                select: {
                    workoutId: true,
                    workout: {
                        select: {
                            performedAt: true,
                        },
                    },
                    sets: {
                        where: {
                            completedAt: {
                                not: null,
                            },
                        },
                        orderBy: {
                            setNumber: "asc",
                        },
                    },
                },
            });

            if (!previousWorkoutExercise) {
                return null;
            }

            return {
                exerciseId,
                workoutId: previousWorkoutExercise.workoutId,
                performedAt: previousWorkoutExercise.workout.performedAt,
                sets: previousWorkoutExercise.sets,
            };
        }),
    );

    return previousPerformances.filter(
        (performance): performance is NonNullable<typeof performance> => performance !== null,
    );
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

export async function startWorkoutService(userId: string, workoutId: string) {
    return runSerializableTransaction(async (tx) => {
        const workout = await tx.workout.findFirst({
            where: {
                id: workoutId,
                userId,
            },
        });

        if (!workout) {
            throw new AppError("Workout not found", 404);
        }

        // Starting a workout is idempotent. The session page can request this
        // more than once while mounting (for example in React Strict Mode).
        if (workout.status === "ACTIVE") {
            return workout;
        }

        if (workout.status === "COMPLETED") {
            throw new AppError("Completed workout cannot be started", 409);
        }

        const activeWorkout = await tx.workout.findFirst({
            where: {
                userId,
                status: "ACTIVE",
            },
            select: {
                id: true,
            },
        });

        if (activeWorkout) {
            throw new AppError("Another workout is already active", 409);
        }

        return tx.workout.update({
            where: {
                id: workoutId,
            },
            data: {
                status: "ACTIVE",
                startedAt: new Date(),
                completedAt: null,
            },
        });
    });
}

export async function finishWorkoutService(userId: string, workoutId: string) {
    return runSerializableTransaction(async (tx) => {
        const workout = await tx.workout.findFirst({
            where: {
                id: workoutId,
                userId,
            },
        });

        if (!workout) {
            throw new AppError("Workout not found", 404);
        }

        if (workout.status !== "ACTIVE") {
            throw new AppError(
                workout.status === "COMPLETED"
                    ? "Workout is already completed"
                    : "Workout must be started before it can be finished",
                409,
            );
        }

        const completedSetCount = await tx.workoutSet.count({
            where: {
                completedAt: {
                    not: null,
                },
                workoutExercise: {
                    workoutId,
                },
            },
        });

        if (completedSetCount === 0) {
            throw new AppError("Complete at least one set before finishing the workout", 409);
        }

        return tx.workout.update({
            where: {
                id: workoutId,
            },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
            },
        });
    });
}
