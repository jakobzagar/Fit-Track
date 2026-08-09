import request from "supertest";
import {describe, expect, it} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/auth";
import {
    addExerciseToWorkoutResponseSchema,
    addSetToWorkoutExerciseResponseSchema,
    workoutExerciseResponseSchema,
    workoutSetResponseSchema,
} from "@fit-track/shared/workout-exercises";
import {app} from "../../app.js";
import {prisma} from "../../db/prisma.js";
import {
    authenticated,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
} from "../../test/fixtures.js";

describe("POST /api/workouts/:workoutId/exercises", () => {
    it("adds owned active exercises at sequential positions", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const first = await createTestExercise(owner.user.id, {name: "Bench"});
        const second = await createTestExercise(owner.user.id, {name: "Squat"});

        const firstResponse = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: first.id, notes: "  Controlled  "});
        const secondResponse = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: second.id});

        expect(firstResponse.status).toBe(201);
        expect(
            addExerciseToWorkoutResponseSchema.parse(firstResponse.body).workoutExercise,
        ).toMatchObject({position: 1, notes: "Controlled", exerciseId: first.id});
        expect(
            addExerciseToWorkoutResponseSchema.parse(secondResponse.body).workoutExercise,
        ).toMatchObject({position: 2, exerciseId: second.id});
    });

    it("rejects duplicates, archived exercises, and resources owned by another user", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const archived = await createTestExercise(owner.user.id, {
            name: "Archived",
            isArchived: true,
        });
        const foreign = await createTestExercise(other.user.id, {name: "Foreign"});
        await createTestWorkoutExercise(workout.id, exercise.id);

        const duplicate = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: exercise.id});
        const archivedResponse = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: archived.id});
        const foreignResponse = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: foreign.id});

        expect(duplicate.status).toBe(409);
        expect(archivedResponse.status).toBe(404);
        expect(foreignResponse.status).toBe(404);
    });

    it("does not add to another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);
        const exercise = await createTestExercise(owner.user.id);

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: exercise.id});

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({message: "Workout not found"});
    });
});

describe("workout exercise updates and deletion", () => {
    it("moves an exercise and shifts the other positions", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercises = await Promise.all([
            createTestExercise(owner.user.id, {name: "First"}),
            createTestExercise(owner.user.id, {name: "Second"}),
            createTestExercise(owner.user.id, {name: "Third"}),
        ]);
        const items = await Promise.all(
            exercises.map((exercise, index) =>
                createTestWorkoutExercise(workout.id, exercise.id, index + 1),
            ),
        );

        const response = await authenticated(
            "patch",
            `/api/workouts/${workout.id}/exercises/${items[2]!.id}`,
            owner.cookie,
        ).send({position: 1, notes: "  First now  "});
        const positions = await prisma.workoutExercise.findMany({
            where: {workoutId: workout.id},
            orderBy: {position: "asc"},
        });

        expect(response.status).toBe(200);
        expect(workoutExerciseResponseSchema.parse(response.body).workoutExercise).toMatchObject({
            position: 1,
            notes: "First now",
        });
        expect(positions.map((item) => item.id)).toEqual([
            items[2]!.id,
            items[0]!.id,
            items[1]!.id,
        ]);
    });

    it("rejects a position beyond the exercise count", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const response = await authenticated(
            "patch",
            `/api/workouts/${workout.id}/exercises/${item.id}`,
            owner.cookie,
        ).send({position: 2});

        expect(response.status).toBe(400);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Position exceeds workout exercise count",
        });
    });

    it("deletes an exercise with its sets and closes the position gap", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const firstExercise = await createTestExercise(owner.user.id, {name: "First"});
        const secondExercise = await createTestExercise(owner.user.id, {name: "Second"});
        const first = await createTestWorkoutExercise(workout.id, firstExercise.id, 1);
        const second = await createTestWorkoutExercise(workout.id, secondExercise.id, 2);
        await createTestSet(first.id);

        const response = await authenticated(
            "delete",
            `/api/workouts/${workout.id}/exercises/${first.id}`,
            owner.cookie,
        );

        expect(response.status).toBe(200);
        expect(messageResponseSchema.parse(response.body).message).toContain("deleted");
        expect(await prisma.workoutSet.count()).toBe(0);
        await expect(
            prisma.workoutExercise.findUniqueOrThrow({where: {id: second.id}}),
        ).resolves.toMatchObject({position: 1});
    });

    it("does not update or delete another user's workout exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);
        const exercise = await createTestExercise(other.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const update = await authenticated(
            "patch",
            `/api/workouts/${workout.id}/exercises/${item.id}`,
            owner.cookie,
        ).send({notes: "Blocked"});
        const deletion = await authenticated(
            "delete",
            `/api/workouts/${workout.id}/exercises/${item.id}`,
            owner.cookie,
        );

        expect(update.status).toBe(404);
        expect(deletion.status).toBe(404);
    });
});

describe("workout sets", () => {
    it("adds repetition and duration sets with sequential numbers", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const first = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets`,
            owner.cookie,
        ).send({reps: 10, weight: 82.5});
        const second = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets`,
            owner.cookie,
        ).send({durationSeconds: 60});

        expect(first.status).toBe(201);
        expect(
            addSetToWorkoutExerciseResponseSchema.parse(first.body).workoutExerciseSet,
        ).toMatchObject({setNumber: 1, reps: 10, weight: 82.5});
        expect(
            addSetToWorkoutExerciseResponseSchema.parse(second.body).workoutExerciseSet,
        ).toMatchObject({setNumber: 2, durationSeconds: 60});
    });

    it("validates new set values and workout ownership", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);
        const exercise = await createTestExercise(other.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const invalid = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets`,
            other.cookie,
        ).send({weight: 50});
        const foreign = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets`,
            owner.cookie,
        ).send({reps: 10});

        expect(invalid.status).toBe(400);
        expect(foreign.status).toBe(404);
    });

    it("updates values but prevents clearing both reps and duration", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);
        const set = await createTestSet(item.id, 1, {reps: 10, durationSeconds: null});
        const path = `/api/workouts/${workout.id}/exercises/${item.id}/sets/${set.id}`;

        const updated = await authenticated("patch", path, owner.cookie).send({
            reps: 12,
            weight: 90,
        });
        const invalid = await authenticated("patch", path, owner.cookie).send({reps: null});

        expect(updated.status).toBe(200);
        expect(workoutSetResponseSchema.parse(updated.body).workoutExerciseSet).toMatchObject({
            reps: 12,
            weight: 90,
        });
        expect(invalid.status).toBe(400);
        expect(messageResponseSchema.parse(invalid.body)).toEqual({
            message: "Either reps or durationSeconds is required",
        });
    });

    it("deletes a set and closes the numbering gap", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);
        const first = await createTestSet(item.id, 1);
        const second = await createTestSet(item.id, 2);

        const response = await authenticated(
            "delete",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets/${first.id}`,
            owner.cookie,
        );

        expect(response.status).toBe(200);
        await expect(
            prisma.workoutSet.findUniqueOrThrow({where: {id: second.id}}),
        ).resolves.toMatchObject({setNumber: 1});
    });

    it("does not update or delete another user's set", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);
        const exercise = await createTestExercise(other.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);
        const set = await createTestSet(item.id, 1, {reps: 10});
        const path = `/api/workouts/${workout.id}/exercises/${item.id}/sets/${set.id}`;

        const update = await authenticated("patch", path, owner.cookie).send({reps: 12});
        const deletion = await authenticated("delete", path, owner.cookie);

        expect(update.status).toBe(404);
        expect(deletion.status).toBe(404);
        await expect(
            prisma.workoutSet.findUniqueOrThrow({where: {id: set.id}}),
        ).resolves.toMatchObject({reps: 10});
    });

    it("rejects a valid set ID under mismatched workout parents", async () => {
        const owner = await createTestUser("owner@example.com");
        const firstWorkout = await createTestWorkout(owner.user.id);
        const secondWorkout = await createTestWorkout(owner.user.id, {name: "Second"});
        const firstExercise = await createTestExercise(owner.user.id, {name: "Bench"});
        const secondExercise = await createTestExercise(owner.user.id, {name: "Squat"});
        const firstItem = await createTestWorkoutExercise(firstWorkout.id, firstExercise.id);
        const secondItem = await createTestWorkoutExercise(secondWorkout.id, secondExercise.id);
        const set = await createTestSet(firstItem.id, 1, {reps: 10});

        const wrongExercise = await authenticated(
            "patch",
            `/api/workouts/${firstWorkout.id}/exercises/${secondItem.id}/sets/${set.id}`,
            owner.cookie,
        ).send({reps: 12});
        const wrongWorkout = await authenticated(
            "delete",
            `/api/workouts/${secondWorkout.id}/exercises/${firstItem.id}/sets/${set.id}`,
            owner.cookie,
        );

        expect(wrongExercise.status).toBe(404);
        expect(wrongWorkout.status).toBe(404);
        await expect(
            prisma.workoutSet.findUniqueOrThrow({where: {id: set.id}}),
        ).resolves.toMatchObject({reps: 10});
    });
});

describe("workout set completion", () => {
    it("completes and reopens a set during an active workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id, {
            status: "ACTIVE",
            startedAt: new Date(),
        });
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);
        const set = await createTestSet(item.id);
        const path = `/api/workouts/${workout.id}/exercises/${item.id}/sets/${set.id}/completion`;

        const completed = await authenticated("patch", path, owner.cookie).send({
            completed: true,
            reps: 12,
        });
        const reopened = await authenticated("patch", path, owner.cookie).send({completed: false});

        expect(completed.status).toBe(200);
        expect(
            workoutSetResponseSchema.parse(completed.body).workoutExerciseSet.completedAt,
        ).not.toBeNull();
        expect(
            workoutSetResponseSchema.parse(reopened.body).workoutExerciseSet.completedAt,
        ).toBeNull();
    });

    it("rejects completion outside an active workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);
        const set = await createTestSet(item.id);

        const response = await authenticated(
            "patch",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets/${set.id}/completion`,
            owner.cookie,
        ).send({completed: true});

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Sets can only be completed during an active workout",
        });
    });

    it("does not change completion for another user's set or mismatched parents", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const foreignWorkout = await createTestWorkout(other.user.id, {
            status: "ACTIVE",
            startedAt: new Date(),
        });
        const foreignExercise = await createTestExercise(other.user.id);
        const foreignItem = await createTestWorkoutExercise(foreignWorkout.id, foreignExercise.id);
        const foreignSet = await createTestSet(foreignItem.id);
        const ownerWorkout = await createTestWorkout(owner.user.id, {
            status: "ACTIVE",
            startedAt: new Date(),
        });
        const ownerExercise = await createTestExercise(owner.user.id);
        const ownerItem = await createTestWorkoutExercise(ownerWorkout.id, ownerExercise.id);
        const ownerSet = await createTestSet(ownerItem.id);

        const foreign = await authenticated(
            "patch",
            `/api/workouts/${foreignWorkout.id}/exercises/${foreignItem.id}/sets/${foreignSet.id}/completion`,
            owner.cookie,
        ).send({completed: true, reps: 10});
        const mismatched = await authenticated(
            "patch",
            `/api/workouts/${ownerWorkout.id}/exercises/${foreignItem.id}/sets/${ownerSet.id}/completion`,
            owner.cookie,
        ).send({completed: true, reps: 10});

        expect(foreign.status).toBe(404);
        expect(mismatched.status).toBe(404);
        const sets = await prisma.workoutSet.findMany({
            where: {id: {in: [foreignSet.id, ownerSet.id]}},
        });
        expect(sets.every((set) => set.completedAt === null)).toBe(true);
    });
});

describe("completed workout mutations", () => {
    it("keeps exercises and sets in a completed workout read-only", async () => {
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

        const responses = await Promise.all([
            authenticated("post", `/api/workouts/${workout.id}/exercises`, owner.cookie).send({
                exerciseId: otherExercise.id,
            }),
            authenticated("patch", itemPath, owner.cookie).send({notes: "Changed"}),
            authenticated("delete", itemPath, owner.cookie),
            authenticated("post", `${itemPath}/sets`, owner.cookie).send({reps: 12}),
            authenticated("patch", setPath, owner.cookie).send({reps: 12}),
            authenticated("delete", setPath, owner.cookie),
        ]);

        expect(responses.map((response) => response.status)).toEqual([
            409, 409, 409, 409, 409, 409,
        ]);
        for (const response of responses) {
            expect(messageResponseSchema.parse(response.body)).toEqual({
                message: "Completed workout is read-only",
            });
        }
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
        expect(await prisma.workoutExercise.count()).toBe(0);
    });
});
