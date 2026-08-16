import jwt from "jsonwebtoken";
import request from "supertest";
import {app} from "../../app.js";
import {env} from "../../config/env.js";
import {prisma} from "../../db/prisma.js";

export const testOrigin = env.clientUrl;

export const createTestUser = async (email: string) => {
    const user = await prisma.user.create({
        data: {name: "Test User", email, passwordHash: "not-used-by-tests"},
    });
    const token = jwt.sign({userId: user.id}, env.jwtSecret, {expiresIn: "7d"});

    return {user, cookie: `token=${token}`};
};

export const authenticated = (
    method: "get" | "post" | "patch" | "delete",
    path: string,
    cookie: string,
) => request(app)[method](path).set("Cookie", cookie).set("Origin", testOrigin);

export const createTestWorkout = (
    userId: string,
    overrides: {
        name?: string;
        status?: "DRAFT" | "ACTIVE" | "COMPLETED";
        performedAt?: Date;
        startedAt?: Date | null;
        completedAt?: Date | null;
        notes?: string | null;
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
) =>
    prisma.exercise.create({
        data: {
            name: "Test exercise",
            muscleGroup: "Chest",
            userId,
            ...overrides,
        },
    });

export const createTestWorkoutExercise = (
    workoutId: string,
    exerciseId: string,
    position = 1,
    notes: string | null = null,
) =>
    prisma.workoutExercise.create({
        data: {workoutId, exerciseId, position, notes},
    });

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
