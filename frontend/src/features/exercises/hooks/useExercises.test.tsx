import {act, renderHook, waitFor} from "@testing-library/react";
import {http, HttpResponse, delay} from "msw";
import {describe, expect, test} from "vitest";
import {server} from "../../../test/mocks/server";
import {useExercises} from "./useExercises";

const API_URL = "http://localhost:3001/api";
const activeExercise = {
    id: "123e4567-e89b-42d3-a456-426614174001",
    userId: "123e4567-e89b-42d3-a456-426614174000",
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    isArchived: false,
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};

describe("useExercises", () => {
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
        expect(result.current.archivingExerciseId).toBeNull();
        expect(result.current.mutationError).toBe("Exercise in use");
    });

    test("loads the latest view after a rapid status change", async () => {
        server.use(
            http.get(`${API_URL}/exercises`, async ({request}) => {
                const status = new URL(request.url).searchParams.get("status");
                if (status === "active") await delay(40);
                return HttpResponse.json({
                    exercises:
                        status === "archived"
                            ? [{...activeExercise, name: "Archived press", isArchived: true}]
                            : [activeExercise],
                });
            }),
        );
        const {result, rerender} = renderHook(({view}) => useExercises(view), {
            initialProps: {view: "active" as "active" | "archived"},
        });
        rerender({view: "archived"});

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await waitFor(() => expect(result.current.exercises[0]?.name).toBe("Archived press"));
    });
});
