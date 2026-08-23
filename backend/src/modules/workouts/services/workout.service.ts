import {prisma} from "../../../db/prisma.js";
import {AppError} from "../../../common/errors/app.error.js";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "@fit-track/shared/workouts";
import {assertWorkoutIsMutable} from "../policies/workout-edit.policy.js";

function workoutDateToTimestamp(date: string) {
    return new Date(`${date}T00:00:00.000Z`);
}

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

    const exerciseIds = workout.workoutExercises.map(({exerciseId}) => exerciseId);
    if (exerciseIds.length === 0) return [];

    const candidates = await prisma.workoutExercise.findMany({
        where: {
            exerciseId: {
                in: exerciseIds,
            },
            workoutId: {
                not: workoutId,
            },
            workout: {
                userId,
                status: "COMPLETED",
                completedAt: {
                    not: null,
                },
            },
            sets: {
                some: {
                    completedAt: {
                        not: null,
                    },
                },
            },
        },
        orderBy: [
            {
                workout: {
                    completedAt: "desc",
                },
            },
            {
                id: "desc",
            },
        ],
        select: {
            exerciseId: true,
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

    const latestByExerciseId = new Map<string, (typeof candidates)[number]>();
    for (const candidate of candidates) {
        if (!latestByExerciseId.has(candidate.exerciseId)) {
            latestByExerciseId.set(candidate.exerciseId, candidate);
        }
    }

    return exerciseIds.flatMap((exerciseId) => {
        const performance = latestByExerciseId.get(exerciseId);
        return performance
            ? [
                  {
                      exerciseId,
                      workoutId: performance.workoutId,
                      performedAt: performance.workout.performedAt,
                      sets: performance.sets,
                  },
              ]
            : [];
    });
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
                performedAt: workoutDateToTimestamp(data.performedAt),
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

    assertWorkoutIsMutable(workout.status);

    return prisma.workout.update({
        where: {
            id: workoutId,
        },
        data: {
            ...(data.name !== undefined && {name: data.name}),
            ...(data.performedAt !== undefined && {
                performedAt: workoutDateToTimestamp(data.performedAt),
            }),
            ...(data.notes !== undefined && {notes: data.notes}),
        },
    });
}
