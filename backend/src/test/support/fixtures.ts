import jwt from "jsonwebtoken";
import request from "supertest";
import type {WorkoutStatus} from "@fit-track/shared/workouts";
import {app} from "../../app.js";
import {env} from "../../config/env.js";
import {prisma} from "../../db/prisma.js";
import {normalizeExerciseName} from "../../modules/exercises/utils/exercise-name.js";

export const testOrigin = env.clientOrigin;

export const createTestUser = async (email: string) => {
    const user = await prisma.user.create({
        data: {name: "Test User", email, passwordHash: "not-used-by-tests"},
    });
    const token = jwt.sign({userId: user.id}, env.jwtSecret, {expiresIn: "7d"});

    return {user, cookie: `token=${token}`};
};

export const requestAsUser = (
    method: "get" | "post" | "patch" | "delete",
    path: string,
    cookie: string,
) => request(app)[method](path).set("Cookie", cookie).set("Origin", testOrigin);

export const createTestWorkout = (
    userId: string,
    overrides: {
        name?: string;
        status?: WorkoutStatus;
        startedAt?: Date | null;
        completedAt?: Date | null;
        notes?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
    } = {},
) =>
    prisma.workout.create({
        data: {name: "Test workout", userId, ...overrides},
    });

export const createTestExercise = (
    userId: string,
    overrides: {
        name?: string;
        muscleGroup?: string;
        equipment?: string | null;
        isArchived?: boolean;
    } = {},
) => {
    const name = overrides.name ?? "Test exercise";

    return prisma.exercise.create({
        data: {
            name,
            normalizedName: normalizeExerciseName(name),
            muscleGroup: "Chest",
            userId,
            ...overrides,
        },
    });
};

export const createTestWorkoutExercise = (
    workoutId: string,
    exerciseId: string,
    position = 1,
    notes: string | null = null,
) => {
    return prisma.exercise.findUniqueOrThrow({where: {id: exerciseId}}).then((exercise) =>
        prisma.workoutExercise.create({
            data: {
                workoutId,
                exerciseId,
                position,
                notes,
                exerciseName: exercise.name,
                exerciseMuscleGroup: exercise.muscleGroup,
                exerciseEquipment: exercise.equipment,
            },
        }),
    );
};

export const createTestSet = (
    workoutExerciseId: string,
    setNumber = 1,
    overrides: {
        reps?: number | null;
        weight?: number | null;
        durationSeconds?: number | null;
        completedAt?: Date | null;
    } = {},
) =>
    prisma.workoutSet.create({
        data: {workoutExerciseId, setNumber, reps: 10, ...overrides},
    });
