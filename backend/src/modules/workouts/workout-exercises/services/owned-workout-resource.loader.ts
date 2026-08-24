import {AppError} from "../../../../common/errors/app.error.js";
import {Prisma} from "../../../../../generated/prisma/client.js";
import {assertWorkoutIsMutable} from "../../policies/workout-edit.policy.js";

export async function loadOwnedMutableWorkoutExercise(
    tx: Prisma.TransactionClient,
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
) {
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
    return workoutExercise;
}

async function loadOwnedWorkoutSet(
    tx: Prisma.TransactionClient,
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
) {
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
        include: {
            workoutExercise: {
                select: {
                    workout: {select: {status: true}},
                },
            },
        },
    });

    if (!workoutSet) {
        throw new AppError("Workout set not found", 404);
    }

    return workoutSet;
}

export async function loadOwnedMutableWorkoutSet(
    tx: Prisma.TransactionClient,
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
) {
    const workoutSet = await loadOwnedWorkoutSet(tx, userId, workoutId, workoutExerciseId, setId);

    assertWorkoutIsMutable(workoutSet.workoutExercise.workout.status);
    return workoutSet;
}

export async function loadOwnedActiveWorkoutSet(
    tx: Prisma.TransactionClient,
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
) {
    const workoutSet = await loadOwnedWorkoutSet(tx, userId, workoutId, workoutExerciseId, setId);

    if (workoutSet.workoutExercise.workout.status !== "ACTIVE") {
        throw new AppError("Sets can only be completed during an active workout", 409);
    }

    return workoutSet;
}
