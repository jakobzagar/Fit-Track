import {AppError} from "../../common/errors/app.error.js";
import {runSerializableTransaction} from "../../db/transaction.js";
import {assertWorkoutIsMutable} from "../workouts/workout-edit.policy.js";
import type {
    AddExerciseToWorkoutInput,
    UpdateWorkoutExerciseInput,
} from "@fit-track/shared/workout-exercises";

export async function addExerciseToWorkoutService(
    userId: string,
    workoutId: string,
    data: AddExerciseToWorkoutInput,
) {
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

        assertWorkoutIsMutable(workout.status);

        const exercise = await tx.exercise.findFirst({
            where: {
                id: data.exerciseId,
                userId,
                isArchived: false,
            },
        });

        if (!exercise) {
            throw new AppError("Exercise not found", 404);
        }

        const existingExercise = await tx.workoutExercise.findUnique({
            where: {
                workoutId_exerciseId: {
                    workoutId,
                    exerciseId: data.exerciseId,
                },
            },
        });

        if (existingExercise) {
            throw new AppError("Exercise already added to workout", 409);
        }

        const lastExercise = await tx.workoutExercise.findFirst({
            where: {
                workoutId,
            },
            orderBy: {
                position: "desc",
            },
            select: {
                position: true,
            },
        });

        const position: number = (lastExercise?.position ?? 0) + 1;

        return tx.workoutExercise.create({
            data: {
                workoutId,
                exerciseId: data.exerciseId,
                position,
                ...(data.notes !== undefined && {notes: data.notes}),
            },
            include: {
                exercise: true,
            },
        });
    });
}

export async function updateWorkoutExerciseService(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    data: UpdateWorkoutExerciseInput,
) {
    return runSerializableTransaction(async (tx) => {
        const workoutExercise = await tx.workoutExercise.findFirst({
            where: {
                id: workoutExerciseId,
                workoutId,
                workout: {
                    userId,
                },
            },
            include: {
                workout: {
                    select: {status: true},
                },
            },
        });

        if (!workoutExercise) {
            throw new AppError("Workout exercise not found", 404);
        }

        assertWorkoutIsMutable(workoutExercise.workout.status);

        if (data.position !== undefined && data.position !== workoutExercise.position) {
            const exerciseCount = await tx.workoutExercise.count({
                where: {
                    workoutId,
                },
            });

            if (data.position > exerciseCount) {
                throw new AppError("Position exceeds workout exercise count", 400);
            }

            await tx.workoutExercise.update({
                where: {
                    id: workoutExerciseId,
                },
                data: {
                    position: exerciseCount + 1,
                },
            });

            const exercisesToShift = await tx.workoutExercise.findMany({
                where: {
                    workoutId,
                    position:
                        data.position < workoutExercise.position
                            ? {
                                  gte: data.position,
                                  lt: workoutExercise.position,
                              }
                            : {
                                  gt: workoutExercise.position,
                                  lte: data.position,
                              },
                },
                orderBy: {
                    position: data.position < workoutExercise.position ? "desc" : "asc",
                },
                select: {
                    id: true,
                },
            });

            for (const exerciseToShift of exercisesToShift) {
                await tx.workoutExercise.update({
                    where: {
                        id: exerciseToShift.id,
                    },
                    data: {
                        position:
                            data.position < workoutExercise.position
                                ? {increment: 1}
                                : {decrement: 1},
                    },
                });
            }
        }

        return tx.workoutExercise.update({
            where: {
                id: workoutExerciseId,
            },
            data: {
                ...(data.position !== undefined && {position: data.position}),
                ...(data.notes !== undefined && {notes: data.notes}),
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
        });
    });
}

export async function deleteWorkoutExerciseService(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
) {
    return runSerializableTransaction(async (tx) => {
        const workoutExercise = await tx.workoutExercise.findFirst({
            where: {
                id: workoutExerciseId,
                workoutId,
                workout: {
                    userId,
                },
            },
            include: {
                workout: {
                    select: {status: true},
                },
            },
        });

        if (!workoutExercise) {
            throw new AppError("Workout exercise not found", 404);
        }

        assertWorkoutIsMutable(workoutExercise.workout.status);

        await tx.workoutExercise.delete({
            where: {
                id: workoutExerciseId,
            },
        });

        const exercisesToShift = await tx.workoutExercise.findMany({
            where: {
                workoutId,
                position: {
                    gt: workoutExercise.position,
                },
            },
            orderBy: {
                position: "asc",
            },
            select: {
                id: true,
            },
        });

        for (const exerciseToShift of exercisesToShift) {
            await tx.workoutExercise.update({
                where: {
                    id: exerciseToShift.id,
                },
                data: {
                    position: {
                        decrement: 1,
                    },
                },
            });
        }
    });
}
