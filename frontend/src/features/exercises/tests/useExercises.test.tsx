import {act, renderHook, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {createDeferred} from "../../../test/deferred";
import {exercise as activeExercise} from "../../../test/fixtures/exercises";
import {server} from "../../../test/mocks/server";
import type {ExerciseStatus} from "@fit-track/shared/exercises";
import {useExercises} from "../hooks/useExercises";

describe("useExercises", () => {
    test("keeps exercises sorted by name after creating and renaming one", async () => {
        const squat = {
            ...activeExercise,
            id: "123e4567-e89b-42d3-a456-426614174002",
            name: "Squat",
        };
        const deadlift = {
            ...activeExercise,
            id: "123e4567-e89b-42d3-a456-426614174003",
            name: "Deadlift",
        };
        const overheadPress = {...deadlift, name: "Overhead press"};
        server.use(
            http.get(`${API_URL}/exercises`, () =>
                HttpResponse.json({exercises: [activeExercise, squat]}),
            ),
            http.post(`${API_URL}/exercises`, () =>
                HttpResponse.json({exercise: deadlift}, {status: 201}),
            ),
            http.patch(`${API_URL}/exercises/${deadlift.id}`, () =>
                HttpResponse.json({exercise: overheadPress}),
            ),
        );
        const {result} = renderHook(() => useExercises("active"));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(() => result.current.create({name: "Deadlift", muscleGroup: "Back"}));
        expect(result.current.exercises.map(({name}) => name)).toEqual([
            "Bench press",
            "Deadlift",
            "Squat",
        ]);

        await act(() => result.current.update(deadlift.id, {name: "Overhead press"}));
        expect(result.current.exercises.map(({name}) => name)).toEqual([
            "Bench press",
            "Overhead press",
            "Squat",
        ]);
    });

    test("does not append an exercise when creation fails", async () => {
        server.use(
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: []})),
            http.post(`${API_URL}/exercises`, () =>
                HttpResponse.json({message: "Duplicate exercise"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() => useExercises("active"));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.create({name: "Bench press", muscleGroup: "Chest"});
            } catch (error) {
                caught = error;
            }
        });

        expect(caught).toEqual(expect.objectContaining({message: "Duplicate exercise"}));
        expect(result.current.exercises).toEqual([]);
        expect(result.current.mutationError).toBe("Duplicate exercise");
    });

    test("keeps the existing exercise when an update fails", async () => {
        server.use(
            http.get(`${API_URL}/exercises`, () =>
                HttpResponse.json({exercises: [activeExercise]}),
            ),
            http.patch(`${API_URL}/exercises/${activeExercise.id}`, () =>
                HttpResponse.json({message: "Update blocked"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() => useExercises("active"));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.update(activeExercise.id, {name: "Incline press"});
            } catch (error) {
                caught = error;
            }
        });

        expect(caught).toEqual(expect.objectContaining({message: "Update blocked"}));
        expect(result.current.exercises[0]?.name).toBe(activeExercise.name);
        expect(result.current.mutationError).toBe("Update blocked");
    });

    test("keeps an exercise when archiving fails", async () => {
        server.use(
            http.get(`${API_URL}/exercises`, () =>
                HttpResponse.json({exercises: [activeExercise]}),
            ),
            http.delete(`${API_URL}/exercises/${activeExercise.id}`, () =>
                HttpResponse.json({message: "Exercise in use"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() => useExercises("active"));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(() => result.current.archive(activeExercise.id));

        expect(result.current.exercises).toHaveLength(1);
        expect(result.current.updatingExerciseStatusId).toBeNull();
        expect(result.current.mutationError).toBe("Exercise in use");
    });

    test("loads the latest view after a rapid status change", async () => {
        const activeRequestStarted = createDeferred();
        const releaseActiveRequest = createDeferred();
        const activeRequestCompleted = createDeferred();
        server.use(
            http.get(`${API_URL}/exercises`, async ({request}) => {
                const status = new URL(request.url).searchParams.get("status");
                if (status === "active") {
                    activeRequestStarted.resolve();
                    await releaseActiveRequest.promise;
                    activeRequestCompleted.resolve();
                }
                return HttpResponse.json({
                    exercises:
                        status === "archived"
                            ? [{...activeExercise, name: "Archived press", isArchived: true}]
                            : [activeExercise],
                });
            }),
        );
        const {result, rerender} = renderHook(({status}) => useExercises(status), {
            initialProps: {status: "active" as ExerciseStatus},
        });
        await activeRequestStarted.promise;
        rerender({status: "archived"});

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await waitFor(() => expect(result.current.exercises[0]?.name).toBe("Archived press"));
        await act(async () => {
            releaseActiveRequest.resolve();
            await activeRequestCompleted.promise;
        });
        expect(result.current.exercises[0]?.name).toBe("Archived press");
    });
});
