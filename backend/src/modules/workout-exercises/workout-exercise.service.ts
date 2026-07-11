import {AppError} from "../../common/errors/app.error.js";
import {runSerializableTransaction} from "../../db/transaction.js";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
} from "./workout-exercise.schema.js";

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

export async function addSetToWorkoutExerciseService(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    data: CreateWorkoutSetInput,
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
        });

        if (!workoutExercise) {
            throw new AppError("Workout exercise not found", 404);
        }

        const lastSet = await tx.workoutSet.findFirst({
            where: {
                workoutExerciseId,
            },
            orderBy: {
                setNumber: "desc",
            },
            select: {
                setNumber: true,
            },
        });

        const setNumber: number = (lastSet?.setNumber ?? 0) + 1;

        return tx.workoutSet.create({
            data: {
                workoutExerciseId,
                setNumber,
                ...(data.reps !== undefined && {reps: data.reps}),
                ...(data.weight !== undefined && {weight: data.weight}),
                ...(data.durationSeconds !== undefined && {durationSeconds: data.durationSeconds}),
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
        });

        if (!workoutExercise) {
            throw new AppError("Workout exercise not found", 404);
        }

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
        });

        if (!workoutExercise) {
            throw new AppError("Workout exercise not found", 404);
        }

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

export async function updateWorkoutSetService(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
    data: UpdateWorkoutSetInput,
) {
    const workoutSet = await runSerializableTransaction(async (tx) => {
        const existingSet = await tx.workoutSet.findFirst({
            where: {
                id: setId,
                workoutExerciseId,
                workoutExercise: {
                    workoutId,
                    workout: {
                        userId,
                    },
                },
            },
        });

        if (!existingSet) {
            throw new AppError("Workout set not found", 404);
        }

        const reps = data.reps !== undefined ? data.reps : existingSet.reps;
        const durationSeconds =
            data.durationSeconds !== undefined ? data.durationSeconds : existingSet.durationSeconds;

        if (reps === null && durationSeconds === null) {
            throw new AppError("Either reps or durationSeconds is required", 400);
        }

        return tx.workoutSet.update({
            where: {
                id: setId,
            },
            data: {
                ...(data.reps !== undefined && {reps: data.reps}),
                ...(data.weight !== undefined && {weight: data.weight}),
                ...(data.durationSeconds !== undefined && {
                    durationSeconds: data.durationSeconds,
                }),
            },
        });
    });

    return workoutSet;
}

export async function deleteWorkoutSetService(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
) {
    return runSerializableTransaction(async (tx) => {
        const workoutSet = await tx.workoutSet.findFirst({
            where: {
                id: setId,
                workoutExerciseId,
                workoutExercise: {
                    workoutId,
                    workout: {
                        userId,
                    },
                },
            },
        });

        if (!workoutSet) {
            throw new AppError("Workout set not found", 404);
        }

        await tx.workoutSet.delete({
            where: {
                id: setId,
            },
        });

        const setsToShift = await tx.workoutSet.findMany({
            where: {
                workoutExerciseId,
                setNumber: {
                    gt: workoutSet.setNumber,
                },
            },
            orderBy: {
                setNumber: "asc",
            },
            select: {
                id: true,
            },
        });

        for (const setToShift of setsToShift) {
            await tx.workoutSet.update({
                where: {
                    id: setToShift.id,
                },
                data: {
                    setNumber: {
                        decrement: 1,
                    },
                },
            });
        }
    });
}
