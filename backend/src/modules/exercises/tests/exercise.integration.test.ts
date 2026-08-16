import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {exerciseResponseSchema, exercisesResponseSchema} from "@fit-track/shared/exercises";
import {app} from "../../../app.js";
import {prisma} from "../../../db/prisma.js";
import {
    authenticated,
    createTestExercise,
    createTestUser,
    testOrigin,
} from "../../../test/support/fixtures.js";

const exerciseInput = {
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
};

const createExercise = (
    userId: string,
    overrides: NonNullable<Parameters<typeof createTestExercise>[1]> = {},
) => createTestExercise(userId, {...exerciseInput, ...overrides});

describe("POST /api/exercises", () => {
    it("normalizes and creates an exercise owned by the authenticated user", async () => {
        const {user, cookie} = await createTestUser("owner@example.com");

        const response = await authenticated("post", "/api/exercises", cookie).send({
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

        const response = await authenticated("post", "/api/exercises", cookie).send({
            name: "Pull-up",
            muscleGroup: "Back",
        });

        expect(response.status).toBe(201);
        expect(exerciseResponseSchema.parse(response.body).exercise.equipment).toBeNull();
    });

    it("rejects a duplicate name for the same user", async () => {
        const {user, cookie} = await createTestUser("owner@example.com");
        await createExercise(user.id);

        const response = await authenticated("post", "/api/exercises", cookie).send(exerciseInput);

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Exercise already exists",
        });
        expect(await prisma.exercise.count()).toBe(1);
    });

    it("allows different users to use the same exercise name", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        await createExercise(owner.user.id);

        const response = await authenticated("post", "/api/exercises", other.cookie).send(
            exerciseInput,
        );

        expect(response.status).toBe(201);
        expect(await prisma.exercise.count({where: {name: exerciseInput.name}})).toBe(2);
    });

    it("rejects invalid data without creating an exercise", async () => {
        const {cookie} = await createTestUser("owner@example.com");

        const response = await authenticated("post", "/api/exercises", cookie).send({
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

describe("GET /api/exercises", () => {
    it("returns only the owner's active exercises ordered by name", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        await createExercise(owner.user.id, {name: "Squat", muscleGroup: "Legs"});
        await createExercise(owner.user.id, {name: "Bench press"});
        await createExercise(owner.user.id, {name: "Archived row", isArchived: true});
        await createExercise(other.user.id, {name: "Other user's exercise"});

        const response = await authenticated("get", "/api/exercises", owner.cookie);
        const body = exercisesResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.exercises.map((exercise) => exercise.name)).toEqual(["Bench press", "Squat"]);
        expect(body.exercises.every((exercise) => exercise.userId === owner.user.id)).toBe(true);
    });

    it("returns only archived exercises when requested", async () => {
        const owner = await createTestUser("owner@example.com");
        await createExercise(owner.user.id, {name: "Active"});
        const archived = await createExercise(owner.user.id, {
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
        const exercise = await createExercise(owner.user.id);

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
        const exercise = await createExercise(archived ? owner.user.id : other.user.id, {
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

describe("PATCH /api/exercises/:exerciseId", () => {
    it("updates selected fields and allows equipment to be cleared", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExercise(owner.user.id);

        const response = await authenticated(
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
        const exercise = await createExercise(owner.user.id);

        const response = await authenticated(
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
        const exercise = await createExercise(owner.user.id);
        await createExercise(owner.user.id, {name: "Squat", muscleGroup: "Legs"});

        const response = await authenticated(
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
        const exercise = await createExercise(other.user.id);

        const response = await authenticated(
            "patch",
            `/api/exercises/${exercise.id}`,
            owner.cookie,
        ).send({name: "Changed"});

        expect(response.status).toBe(404);
        await expect(
            prisma.exercise.findUniqueOrThrow({where: {id: exercise.id}}),
        ).resolves.toMatchObject({name: exercise.name});
    });
});

describe("DELETE /api/exercises/:exerciseId", () => {
    it("archives an owned exercise without deleting it", async () => {
        const owner = await createTestUser("owner@example.com");
        const exercise = await createExercise(owner.user.id);

        const response = await authenticated(
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
        const exercise = await createExercise(other.user.id);

        const response = await authenticated(
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
        const exercise = await createExercise(owner.user.id, {isArchived: true});

        const response = await authenticated(
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
        const exercise = await createExercise(owned ? owner.user.id : other.user.id, {
            isArchived: archived,
        });

        const response = await authenticated(
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
