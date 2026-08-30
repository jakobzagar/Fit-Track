import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {app} from "../../../../app.js";
import {prisma} from "../../../../db/prisma.js";
import {
    requestAsUser,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
} from "../../../../test/support/fixtures.js";

describe("completed workout mutations", () => {
    it.each([
        "add exercise",
        "update exercise",
        "delete exercise",
        "add set",
        "update set",
        "delete set",
    ] as const)("rejects %s", async (operation) => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {
            status: "COMPLETED",
            startedAt: new Date(),
            completedAt: new Date(),
        });
        const exercise = await createTestExercise(owner.user.id);
        const otherExercise = await createTestExercise(owner.user.id, {name: "Other exercise"});
        const item = await createTestWorkoutExercise(workout.id, exercise.id);
        const set = await createTestSet(item.id, 1, {completedAt: new Date()});
        const itemPath = `/api/workouts/${workout.id}/exercises/${item.id}`;
        const setPath = `${itemPath}/sets/${set.id}`;

        const response =
            operation === "add exercise"
                ? await requestAsUser(
                      "post",
                      `/api/workouts/${workout.id}/exercises`,
                      owner.cookie,
                  ).send({exerciseId: otherExercise.id})
                : operation === "update exercise"
                  ? await requestAsUser("patch", itemPath, owner.cookie).send({notes: "Changed"})
                  : operation === "delete exercise"
                    ? await requestAsUser("delete", itemPath, owner.cookie)
                    : operation === "add set"
                      ? await requestAsUser("post", `${itemPath}/sets`, owner.cookie).send({
                            reps: 12,
                        })
                      : operation === "update set"
                        ? await requestAsUser("patch", setPath, owner.cookie).send({reps: 12})
                        : await requestAsUser("delete", setPath, owner.cookie);

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Completed workout is read-only",
        });
        expect(await prisma.workoutExercise.count({where: {workoutId: workout.id}})).toBe(1);
        await expect(
            prisma.workoutSet.findUniqueOrThrow({where: {id: set.id}}),
        ).resolves.toMatchObject({
            reps: 10,
        });
    });
});

describe("workout exercise CSRF protection", () => {
    it("rejects state changes from an untrusted origin", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);

        const response = await request(app)
            .post(`/api/workouts/${workout.id}/exercises`)
            .set("Cookie", owner.cookie)
            .set("Origin", "https://attacker.example")
            .send({exerciseId: exercise.id});

        expect(response.status).toBe(403);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Invalid request origin",
        });
        expect(await prisma.workoutExercise.count()).toBe(0);
    });
});
