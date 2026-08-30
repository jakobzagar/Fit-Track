import {AppError} from "../../../common/errors/app.error.js";
import {runSerializableTransaction} from "../../../db/transaction.js";

function isUniqueConstraintError(error: unknown): error is {code: string} {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function rethrowActiveWorkoutConstraint(error: unknown): never {
    // The partial unique index is the final guard when concurrent transactions race.
    if (isUniqueConstraintError(error)) {
        throw new AppError("Another workout is already active", 409);
    }

    throw error;
}

export async function startWorkoutService(userId: string, workoutId: string) {
    return runSerializableTransaction(async (tx) => {
        const workout = await tx.workout.findFirst({where: {id: workoutId, userId}});

        if (!workout) throw new AppError("Workout not found", 404);

        // Starting is idempotent because the active workout view can mount more than once in React Strict Mode.
        if (workout.status === "ACTIVE") return workout;
        if (workout.status === "COMPLETED") {
            throw new AppError("Completed workout cannot be started", 409);
        }

        const activeWorkout = await tx.workout.findFirst({
            where: {userId, status: "ACTIVE"},
            select: {id: true},
        });
        if (activeWorkout) throw new AppError("Another workout is already active", 409);

        return tx.workout.update({
            where: {id: workoutId},
            data: {status: "ACTIVE", startedAt: new Date(), completedAt: null},
        });
    }).catch(rethrowActiveWorkoutConstraint);
}

export async function finishWorkoutService(userId: string, workoutId: string) {
    return runSerializableTransaction(async (tx) => {
        const workout = await tx.workout.findFirst({where: {id: workoutId, userId}});

        if (!workout) throw new AppError("Workout not found", 404);
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
                completedAt: {not: null},
                workoutExercise: {workoutId},
            },
        });
        if (completedSetCount === 0) {
            throw new AppError("Complete at least one set before finishing the workout", 409);
        }

        return tx.workout.update({
            where: {id: workoutId},
            data: {status: "COMPLETED", completedAt: new Date()},
        });
    });
}

export async function cancelWorkoutService(userId: string, workoutId: string) {
    return runSerializableTransaction(async (tx) => {
        const workout = await tx.workout.findFirst({where: {id: workoutId, userId}});

        if (!workout) throw new AppError("Workout not found", 404);
        if (workout.status !== "ACTIVE") {
            throw new AppError("Only an active workout can be cancelled", 409);
        }

        await tx.workoutSet.updateMany({
            where: {workoutExercise: {workoutId}},
            data: {completedAt: null},
        });

        return tx.workout.update({
            where: {id: workoutId},
            data: {status: "DRAFT", startedAt: null, completedAt: null},
        });
    });
}

export async function reopenWorkoutService(userId: string, workoutId: string) {
    return runSerializableTransaction(async (tx) => {
        const workout = await tx.workout.findFirst({where: {id: workoutId, userId}});

        if (!workout) throw new AppError("Workout not found", 404);
        if (workout.status === "ACTIVE") return workout;
        if (workout.status !== "COMPLETED") {
            throw new AppError("Only a completed workout can be reopened", 409);
        }

        const activeWorkout = await tx.workout.findFirst({
            where: {userId, status: "ACTIVE"},
            select: {id: true},
        });
        if (activeWorkout) throw new AppError("Another workout is already active", 409);

        return tx.workout.update({
            where: {id: workoutId},
            data: {
                status: "ACTIVE",
                startedAt: workout.startedAt ?? new Date(),
                completedAt: null,
            },
        });
    }).catch(rethrowActiveWorkoutConstraint);
}
