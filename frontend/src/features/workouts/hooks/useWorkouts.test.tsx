import {act, renderHook, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, test} from "vitest";
import {server} from "../../../test/mocks/server";
import {createWorkout} from "../../../test/fixtures/workouts";
import {useWorkouts} from "./useWorkouts";

const API_URL = "http://localhost:3001/api";

describe("useWorkouts", () => {
    test("keeps the existing workout when an update fails", async () => {
        const workout = {...createWorkout(), _count: {workoutExercises: 1}};
        server.use(
            http.get(`${API_URL}/workouts`, () => HttpResponse.json({workouts: [workout]})),
            http.patch(`${API_URL}/workouts/${workout.id}`, () =>
                HttpResponse.json({message: "Update blocked"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() => useWorkouts());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.update(workout.id, {name: "Changed"});
            } catch (error) {
                caught = error;
            }
        });

        expect(caught).toEqual(expect.objectContaining({message: "Update blocked"}));
        expect(result.current.workouts[0]?.name).toBe(workout.name);
        expect(result.current.mutationError).toBe("Update blocked");
    });

    test("keeps data and clears pending state when deletion fails", async () => {
        const workout = {...createWorkout(), _count: {workoutExercises: 1}};
        server.use(
            http.get(`${API_URL}/workouts`, () => HttpResponse.json({workouts: [workout]})),
            http.delete(`${API_URL}/workouts/${workout.id}`, () =>
                HttpResponse.json({message: "Deletion blocked"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() => useWorkouts());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(() => result.current.remove(workout.id));

        expect(result.current.workouts).toHaveLength(1);
        expect(result.current.deletingWorkoutId).toBeNull();
        expect(result.current.mutationError).toBe("Deletion blocked");
    });

    test("recovers after repeated load failures", async () => {
        let attempts = 0;
        server.use(
            http.get(`${API_URL}/workouts`, () => {
                attempts += 1;
                return attempts < 3
                    ? HttpResponse.json({message: "Temporary failure"}, {status: 503})
                    : HttpResponse.json({workouts: []});
            }),
        );
        const {result} = renderHook(() => useWorkouts());
        await waitFor(() => expect(result.current.loadError).toBe("Temporary failure"));
        act(() => result.current.retry());
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => result.current.retry());
        await waitFor(() => expect(result.current.loadError).toBe(""));
        expect(attempts).toBe(3);
    });
});
