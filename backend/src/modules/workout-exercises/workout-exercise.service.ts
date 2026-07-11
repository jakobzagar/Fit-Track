import {AppError} from "../../common/errors/app.error.js";
import {runSerializableTransaction} from "../../db/transaction.js";
import type {AddExerciseToWorkoutInput, CreateWorkoutSetInput} from "./workout-exercise.schema.js";

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
