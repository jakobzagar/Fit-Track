import {prisma} from "../../db/prisma.js";
import {env} from "../../config/env.js";

export const assertTestDatabase = () => {
    const databaseName = new URL(env.databaseUrl).pathname.slice(1);

    if (env.nodeEnv !== "test" || !databaseName.endsWith("_test")) {
        throw new Error(
            "Backend tests may only modify a database whose name ends with '_test' while NODE_ENV=test.",
        );
    }
};

export const clearTestDatabase = async () => {
    assertTestDatabase();

    await prisma.$transaction([
        prisma.workoutSet.deleteMany(),
        prisma.workoutExercise.deleteMany(),
        prisma.workout.deleteMany(),
        prisma.exercise.deleteMany(),
        prisma.user.deleteMany(),
    ]);
};

export const disconnectTestDatabase = async () => {
    await prisma.$disconnect();
};
