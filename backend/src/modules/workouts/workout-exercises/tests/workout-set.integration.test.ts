import {describe, expect, it} from "vitest";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {
    addSetToWorkoutExerciseResponseSchema,
    deleteWorkoutSetResponseSchema,
    workoutSetResponseSchema,
} from "@fit-track/shared/workouts";
import {prisma} from "../../../../db/prisma.js";
import {
    authenticated,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
} from "../../../../test/support/fixtures.js";

describe("workout sets", () => {
    it("assigns unique sequential numbers to concurrently added sets", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);
        const path = `/api/workouts/${workout.id}/exercises/${item.id}/sets`;

        const responses = await Promise.all([
            authenticated("post", path, owner.cookie).send({reps: 8}),
            authenticated("post", path, owner.cookie).send({reps: 10}),
        ]);
        const stored = await prisma.workoutSet.findMany({
            where: {workoutExerciseId: item.id},
            orderBy: {setNumber: "asc"},
        });

        expect(responses.map((response) => response.status)).toEqual([201, 201]);
        for (const response of responses)
            addSetToWorkoutExerciseResponseSchema.parse(response.body);
        expect(stored.map(({setNumber}) => setNumber)).toEqual([1, 2]);
    });

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

    it("validates new set values", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets`,
            owner.cookie,
        ).send({weight: 50});

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body).message).toBe(
            "Validation failed",
        );
    });

    it("does not add a set to another user's workout", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);
        const exercise = await createTestExercise(other.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises/${item.id}/sets`,
            owner.cookie,
        ).send({reps: 10});

        expect(response.status).toBe(404);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Workout exercise not found",
        });
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
        expect(deleteWorkoutSetResponseSchema.parse(response.body)).toEqual({
            message: "Workout set deleted successfully",
        });
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
        expect(messageResponseSchema.parse(update.body)).toEqual({
            message: "Workout set not found",
        });
        expect(messageResponseSchema.parse(deletion.body)).toEqual({
            message: "Workout set not found",
        });
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
        expect(messageResponseSchema.parse(wrongExercise.body)).toEqual({
            message: "Workout set not found",
        });
        expect(messageResponseSchema.parse(wrongWorkout.body)).toEqual({
            message: "Workout set not found",
        });
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
        expect(messageResponseSchema.parse(foreign.body)).toEqual({
            message: "Workout set not found",
        });
        expect(messageResponseSchema.parse(mismatched.body)).toEqual({
            message: "Workout set not found",
        });
        const sets = await prisma.workoutSet.findMany({
            where: {id: {in: [foreignSet.id, ownerSet.id]}},
        });
        expect(sets.every((set) => set.completedAt === null)).toBe(true);
    });
});
