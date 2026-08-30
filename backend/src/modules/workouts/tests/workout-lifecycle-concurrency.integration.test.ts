import {describe, expect, it} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {workoutRecordResponseSchema} from "@fit-track/shared/workouts";
import {prisma} from "../../../db/prisma.js";
import {requestAsUser, createTestUser, createTestWorkout} from "../../../test/support/fixtures.js";

async function expectLifecycleConstraint(promise: Promise<unknown>) {
    await expect(promise).rejects.toMatchObject({
        code: "P2039",
        meta: {
            driverAdapterError: {
                cause: {
                    code: "23514",
                },
            },
        },
    });
    await expect(promise).rejects.toThrow(/Workout_lifecycle_timestamps_check/);
}

describe("workout lifecycle database constraints and concurrency", () => {
    it("enforces one active workout per user in PostgreSQL", async () => {
        const owner = await createTestUser("owner@example.com");
        await createTestWorkout(owner.user.id, {status: "ACTIVE", startedAt: new Date()});

        await expect(
            createTestWorkout(owner.user.id, {
                name: "Second active workout",
                status: "ACTIVE",
                startedAt: new Date(),
            }),
        ).rejects.toMatchObject({code: "P2002"});
    });

    it("enforces valid lifecycle timestamps in PostgreSQL", async () => {
        const owner = await createTestUser("owner@example.com");
        const startedAt = new Date("2026-08-15T10:00:00.000Z");
        const completedAt = new Date("2026-08-15T11:00:00.000Z");

        await expectLifecycleConstraint(
            createTestWorkout(owner.user.id, {status: "ACTIVE", completedAt}),
        );
        await expectLifecycleConstraint(
            createTestWorkout(owner.user.id, {status: "COMPLETED", startedAt}),
        );
        await expectLifecycleConstraint(
            createTestWorkout(owner.user.id, {status: "DRAFT", completedAt}),
        );
        await expectLifecycleConstraint(
            createTestWorkout(owner.user.id, {status: "DRAFT", startedAt}),
        );
        await expectLifecycleConstraint(
            createTestWorkout(owner.user.id, {
                status: "COMPLETED",
                startedAt: completedAt,
                completedAt: startedAt,
            }),
        );
    });

    it("allows only one of two concurrent workout starts to become active", async () => {
        const owner = await createTestUser("owner@example.com");
        const first = await createTestWorkout(owner.user.id, {name: "First"});
        const second = await createTestWorkout(owner.user.id, {name: "Second"});

        const responses = await Promise.all(
            [first, second].map((workout) =>
                requestAsUser("post", `/api/workouts/${workout.id}/start`, owner.cookie),
            ),
        );
        const successful = responses.find((response) => response.status === 200);
        const conflicted = responses.find((response) => response.status === 409);

        expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
        expect(workoutRecordResponseSchema.parse(successful?.body).workout.status).toBe("ACTIVE");
        expect(messageResponseSchema.parse(conflicted?.body)).toEqual({
            message: "Another workout is already active",
        });
        expect(await prisma.workout.count({where: {userId: owner.user.id, status: "ACTIVE"}})).toBe(
            1,
        );
    });

    it("allows only one concurrent start or reopen to become active", async () => {
        const owner = await createTestUser("owner@example.com");
        const draft = await createTestWorkout(owner.user.id, {name: "Draft"});
        const completed = await createTestWorkout(owner.user.id, {
            name: "Completed",
            status: "COMPLETED",
            startedAt: new Date(),
            completedAt: new Date(),
        });

        const responses = await Promise.all([
            requestAsUser("post", `/api/workouts/${draft.id}/start`, owner.cookie),
            requestAsUser("post", `/api/workouts/${completed.id}/reopen`, owner.cookie),
        ]);

        expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
        for (const response of responses) {
            if (response.status === 200) workoutRecordResponseSchema.parse(response.body);
            else
                expect(messageResponseSchema.parse(response.body)).toEqual({
                    message: "Another workout is already active",
                });
        }
        expect(await prisma.workout.count({where: {userId: owner.user.id, status: "ACTIVE"}})).toBe(
            1,
        );
    });
});
