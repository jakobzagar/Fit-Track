import {AppError} from "../../../../common/errors/app.error.js";
import {runSerializableTransaction} from "../../../../db/transaction.js";
import {assertWorkoutIsMutable} from "../../policies/workout-edit.policy.js";
import type {
    CreateWorkoutSetInput,
    SetWorkoutSetCompletionInput,
    UpdateWorkoutSetInput,
} from "@fit-track/shared/workouts";

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

export async function updateWorkoutSetService(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
    data: UpdateWorkoutSetInput,
) {
    return runSerializableTransaction(async (tx) => {
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
            include: {
                workoutExercise: {
                    select: {
                        workout: {select: {status: true}},
                    },
                },
            },
        });

        if (!existingSet) {
            throw new AppError("Workout set not found", 404);
        }

        assertWorkoutIsMutable(existingSet.workoutExercise.workout.status);

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

        assertWorkoutIsMutable(workoutSet.workoutExercise.workout.status);

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

export async function setWorkoutSetCompletionService(
    userId: string,
    workoutId: string,
    workoutExerciseId: string,
    setId: string,
    data: SetWorkoutSetCompletionInput,
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
            include: {
                workoutExercise: {
                    select: {
                        workout: {
                            select: {
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        if (!workoutSet) {
            throw new AppError("Workout set not found", 404);
        }

        if (workoutSet.workoutExercise.workout.status !== "ACTIVE") {
            throw new AppError("Sets can only be completed during an active workout", 409);
        }

        const reps = data.reps !== undefined ? data.reps : workoutSet.reps;
        const durationSeconds =
            data.durationSeconds !== undefined ? data.durationSeconds : workoutSet.durationSeconds;

        if (reps === null && durationSeconds === null) {
            throw new AppError("Either reps or durationSeconds is required", 400);
        }

        const isCompleted = workoutSet.completedAt !== null;
        const hasValueChanges =
            data.reps !== undefined ||
            data.weight !== undefined ||
            data.durationSeconds !== undefined;

        if (isCompleted === data.completed && !hasValueChanges) {
            const {workoutExercise: _workoutExercise, ...unchangedWorkoutSet} = workoutSet;
            return unchangedWorkoutSet;
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
                completedAt: data.completed ? new Date() : null,
            },
        });
    });
}
