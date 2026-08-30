import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {exerciseResponseSchema} from "@fit-track/shared/exercises";
import {app} from "../../../app.js";
import {prisma} from "../../../db/prisma.js";
import {
    requestAsUser,
    createTestExercise,
    createTestUser,
    testOrigin,
} from "../../../test/support/fixtures.js";

const exerciseInput = {
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
};

const createExerciseRecord = (
    userId: string,
    overrides: NonNullable<Parameters<typeof createTestExercise>[1]> = {},
) => createTestExercise(userId, {...exerciseInput, ...overrides});

describe("POST /api/exercises", () => {
    it("normalizes and creates an exercise owned by the authenticated user", async () => {
        const {user, cookie} = await createTestUser("owner@example.com");

        const response = await requestAsUser("post", "/api/exercises", cookie).send({
            name: "  Bench press  ",
            muscleGroup: "  Chest  ",
            equipment: "  Barbell  ",
        });
        const body = exerciseResponseSchema.parse(response.body);

        expect(response.status).toBe(201);
        expect(body.exercise).toMatchObject({
            ...exerciseInput,
            userId: user.id,
            isArchived: false,
        });
        await expect(
            prisma.exercise.findUnique({where: {id: body.exercise.id}}),
        ).resolves.toMatchObject({userId: user.id});
    });

    it("stores missing optional equipment as null", async () => {
        const {cookie} = await createTestUser("owner@example.com");

        const response = await requestAsUser("post", "/api/exercises", cookie).send({
            name: "Pull-up",
            muscleGroup: "Back",
        });

        expect(response.status).toBe(201);
        expect(exerciseResponseSchema.parse(response.body).exercise.equipment).toBeNull();
    });

    it("rejects a duplicate name for the same user", async () => {
        const {user, cookie} = await createTestUser("owner@example.com");
        await createExerciseRecord(user.id);

        const response = await requestAsUser("post", "/api/exercises", cookie).send(exerciseInput);

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Exercise already exists",
        });
        expect(await prisma.exercise.count()).toBe(1);
    });

    it("allows different users to use the same exercise name", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        await createExerciseRecord(owner.user.id);

        const response = await requestAsUser("post", "/api/exercises", other.cookie).send(
            exerciseInput,
        );

        expect(response.status).toBe(201);
        expect(await prisma.exercise.count({where: {name: exerciseInput.name}})).toBe(2);
    });

    it("rejects invalid data without creating an exercise", async () => {
        const {cookie} = await createTestUser("owner@example.com");

        const response = await requestAsUser("post", "/api/exercises", cookie).send({
            name: "",
            muscleGroup: "",
            equipment: "",
        });

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body)).toEqual({
            message: "Validation failed",
            errors: {
                name: ["Name is required"],
                muscleGroup: ["Muscle group is required"],
                equipment: ["Equipment is required"],
            },
        });
        expect(await prisma.exercise.count()).toBe(0);
    });

    it("requires authentication", async () => {
        const response = await request(app)
            .post("/api/exercises")
            .set("Origin", testOrigin)
            .send(exerciseInput);

        expect(response.status).toBe(401);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Authentication required",
        });
    });
});

describe("PATCH /api/exercises/:exerciseId", () => {
    it("updates selected fields and allows equipment to be cleared", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExerciseRecord(owner.user.id);

        const response = await requestAsUser(
            "patch",
            `/api/exercises/${exercise.id}`,
            owner.cookie,
        ).send({name: "  Incline press  ", equipment: null});
        const body = exerciseResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.exercise).toMatchObject({
            name: "Incline press",
            muscleGroup: exercise.muscleGroup,
            equipment: null,
        });
    });

    it("rejects an empty update", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExerciseRecord(owner.user.id);

        const response = await requestAsUser(
            "patch",
            `/api/exercises/${exercise.id}`,
            owner.cookie,
        ).send({});

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body).message).toBe(
            "Validation failed",
        );
    });

    it("rejects a name already used by another owned exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExerciseRecord(owner.user.id);
        await createExerciseRecord(owner.user.id, {name: "Squat", muscleGroup: "Legs"});

        const response = await requestAsUser(
            "patch",
            `/api/exercises/${exercise.id}`,
            owner.cookie,
        ).send({name: "Squat"});

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Exercise already exists",
        });
    });

    it("does not update another user's exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const exercise = await createExerciseRecord(other.user.id);

        const response = await requestAsUser(
            "patch",
            `/api/exercises/${exercise.id}`,
            owner.cookie,
        ).send({name: "Changed"});

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Exercise not found",
        });
        await expect(
            prisma.exercise.findUniqueOrThrow({where: {id: exercise.id}}),
        ).resolves.toMatchObject({name: exercise.name});
    });
});

describe("DELETE /api/exercises/:exerciseId", () => {
    it("archives an owned exercise without deleting it", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExerciseRecord(owner.user.id);

        const response = await requestAsUser(
            "delete",
            `/api/exercises/${exercise.id}`,
            owner.cookie,
        );

        expect(response.status).toBe(200);
        expect(exerciseResponseSchema.parse(response.body).exercise.isArchived).toBe(true);
        await expect(
            prisma.exercise.findUniqueOrThrow({where: {id: exercise.id}}),
        ).resolves.toMatchObject({isArchived: true});
    });

    it("does not archive another user's exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const exercise = await createExerciseRecord(other.user.id);

        const response = await requestAsUser(
            "delete",
            `/api/exercises/${exercise.id}`,
            owner.cookie,
        );

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Exercise not found",
        });
    });
});

describe("PATCH /api/exercises/:exerciseId/restore", () => {
    it("restores an archived owned exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExerciseRecord(owner.user.id, {isArchived: true});

        const response = await requestAsUser(
            "patch",
            `/api/exercises/${exercise.id}/restore`,
            owner.cookie,
        );

        expect(response.status).toBe(200);
        expect(exerciseResponseSchema.parse(response.body).exercise.isArchived).toBe(false);
    });

    it.each([
        ["an active owned exercise", false, true],
        ["another user's archived exercise", true, false],
    ])("does not restore %s", async (_case, archived, owned) => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const exercise = await createExerciseRecord(owned ? owner.user.id : other.user.id, {
            isArchived: archived,
        });

        const response = await requestAsUser(
            "patch",
            `/api/exercises/${exercise.id}/restore`,
            owner.cookie,
        );

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Archived exercise not found",
        });
    });
});

describe("exercise CSRF protection", () => {
    it("rejects a state-changing request from an untrusted origin", async () => {
        const owner = await createTestUser("owner@example.com");

        const response = await request(app)
            .post("/api/exercises")
            .set("Cookie", owner.cookie)
            .set("Origin", "https://attacker.example")
            .send(exerciseInput);

        expect(response.status).toBe(403);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Invalid request origin",
        });
        expect(await prisma.exercise.count()).toBe(0);
    });
});
