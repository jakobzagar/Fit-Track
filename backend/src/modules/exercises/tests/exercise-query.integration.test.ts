import {describe, expect, it} from "vitest";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {exerciseResponseSchema, exercisesResponseSchema} from "@fit-track/shared/exercises";
import {authenticated, createTestExercise, createTestUser} from "../../../test/support/fixtures.js";

const exerciseInput = {
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
};

const createExerciseRecord = (
    userId: string,
    overrides: NonNullable<Parameters<typeof createTestExercise>[1]> = {},
) => createTestExercise(userId, {...exerciseInput, ...overrides});

describe("GET /api/exercises", () => {
    it("returns only the owner's active exercises ordered by name", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        await createExerciseRecord(owner.user.id, {name: "Squat", muscleGroup: "Legs"});
        await createExerciseRecord(owner.user.id, {name: "Bench press"});
        await createExerciseRecord(owner.user.id, {name: "Archived row", isArchived: true});
        await createExerciseRecord(other.user.id, {name: "Other user's exercise"});

        const response = await authenticated("get", "/api/exercises", owner.cookie);
        const body = exercisesResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.exercises.map((exercise) => exercise.name)).toEqual(["Bench press", "Squat"]);
        expect(body.exercises.every((exercise) => exercise.userId === owner.user.id)).toBe(true);
    });

    it("returns only archived exercises when requested", async () => {
        const owner = await createTestUser("owner@example.com");
        await createExerciseRecord(owner.user.id, {name: "Active"});
        const archived = await createExerciseRecord(owner.user.id, {
            name: "Archived",
            isArchived: true,
        });

        const response = await authenticated("get", "/api/exercises?status=archived", owner.cookie);
        const body = exercisesResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.exercises).toHaveLength(1);
        expect(body.exercises[0]).toMatchObject({id: archived.id, isArchived: true});
    });

    it("rejects an unsupported status filter", async () => {
        const owner = await createTestUser("owner@example.com");

        const response = await authenticated("get", "/api/exercises?status=deleted", owner.cookie);

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body).message).toBe(
            "Validation failed",
        );
    });
});

describe("GET /api/exercises/:exerciseId", () => {
    it("returns an active exercise owned by the authenticated user", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExerciseRecord(owner.user.id);

        const response = await authenticated("get", `/api/exercises/${exercise.id}`, owner.cookie);

        expect(response.status).toBe(200);
        expect(exerciseResponseSchema.parse(response.body).exercise.id).toBe(exercise.id);
    });

    it.each([
        ["another user's exercise", false],
        ["an archived exercise", true],
    ])("does not expose %s", async (_case, archived) => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const exercise = await createExerciseRecord(archived ? owner.user.id : other.user.id, {
            isArchived: archived,
        });

        const response = await authenticated("get", `/api/exercises/${exercise.id}`, owner.cookie);

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Exercise not found",
        });
    });

    it("rejects an invalid exercise ID", async () => {
        const owner = await createTestUser("owner@example.com");

        const response = await authenticated("get", "/api/exercises/not-a-uuid", owner.cookie);

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body)).toEqual({
            message: "Validation failed",
            errors: {exerciseId: ["Invalid exercise ID"]},
        });
    });
});
