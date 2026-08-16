import {describe, expect, it} from "vitest";
import {messageResponseSchema} from "@fit-track/shared/common";
import {
    addExerciseToWorkoutResponseSchema,
    deleteWorkoutExerciseResponseSchema,
    workoutExerciseResponseSchema,
} from "@fit-track/shared/workout-exercises";
import {prisma} from "../../../db/prisma.js";
import {
    authenticated,
    createTestExercise,
    createTestSet,
    createTestUser,
    createTestWorkout,
    createTestWorkoutExercise,
} from "../../../test/support/fixtures.js";

describe("POST /api/workouts/:workoutId/exercises", () => {
    it("assigns unique sequential positions to concurrently added exercises", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercises = await Promise.all([
            createTestExercise(owner.user.id, {name: "Bench"}),
            createTestExercise(owner.user.id, {name: "Squat"}),
        ]);

        const responses = await Promise.all(
            exercises.map((exercise) =>
                authenticated("post", `/api/workouts/${workout.id}/exercises`, owner.cookie).send({
                    exerciseId: exercise.id,
                }),
            ),
        );
        const stored = await prisma.workoutExercise.findMany({
            where: {workoutId: workout.id},
            orderBy: {position: "asc"},
        });

        expect(responses.map((response) => response.status)).toEqual([201, 201]);
        for (const response of responses) addExerciseToWorkoutResponseSchema.parse(response.body);
        expect(stored.map(({position}) => position)).toEqual([1, 2]);
    });

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

    it("rejects a duplicate exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const exercise = await createTestExercise(owner.user.id);
        await createTestWorkoutExercise(workout.id, exercise.id);

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: exercise.id});

        expect(response.status).toBe(409);
    });

    it("rejects an archived exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const archived = await createTestExercise(owner.user.id, {isArchived: true});

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: archived.id});

        expect(response.status).toBe(404);
    });

    it("rejects an exercise owned by another user", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(owner.user.id);
        const foreign = await createTestExercise(other.user.id);

        const response = await authenticated(
            "post",
            `/api/workouts/${workout.id}/exercises`,
            owner.cookie,
        ).send({exerciseId: foreign.id});

        expect(response.status).toBe(404);
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
    it("preserves unique contiguous positions during concurrent moves", async () => {
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

        const responses = await Promise.all([
            authenticated(
                "patch",
                `/api/workouts/${workout.id}/exercises/${items[0]!.id}`,
                owner.cookie,
            ).send({position: 3}),
            authenticated(
                "patch",
                `/api/workouts/${workout.id}/exercises/${items[2]!.id}`,
                owner.cookie,
            ).send({position: 1}),
        ]);
        const stored = await prisma.workoutExercise.findMany({
            where: {workoutId: workout.id},
            orderBy: {position: "asc"},
        });

        expect(responses.map((response) => response.status)).toEqual([200, 200]);
        for (const response of responses) workoutExerciseResponseSchema.parse(response.body);
        expect(stored.map(({position}) => position)).toEqual([1, 2, 3]);
        expect(new Set(stored.map(({id}) => id)).size).toBe(3);
    });

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
        expect(deleteWorkoutExerciseResponseSchema.parse(response.body)).toEqual({
            message: "Workout exercise deleted successfully",
        });
        expect(await prisma.workoutSet.count()).toBe(0);
        await expect(
            prisma.workoutExercise.findUniqueOrThrow({where: {id: second.id}}),
        ).resolves.toMatchObject({position: 1});
    });

    it("does not update another user's workout exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);
        const exercise = await createTestExercise(other.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const response = await authenticated(
            "patch",
            `/api/workouts/${workout.id}/exercises/${item.id}`,
            owner.cookie,
        ).send({notes: "Blocked"});

        expect(response.status).toBe(404);
    });

    it("does not delete another user's workout exercise", async () => {
        const owner = await createTestUser("owner@example.com");
        const other = await createTestUser("other@example.com");
        const workout = await createTestWorkout(other.user.id);
        const exercise = await createTestExercise(other.user.id);
        const item = await createTestWorkoutExercise(workout.id, exercise.id);

        const response = await authenticated(
            "delete",
            `/api/workouts/${workout.id}/exercises/${item.id}`,
            owner.cookie,
        );

        expect(response.status).toBe(404);
    });
});
