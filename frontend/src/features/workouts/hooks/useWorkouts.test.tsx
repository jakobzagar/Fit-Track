import {act, renderHook, waitFor} from "@testing-library/react";
import {delay, http, HttpResponse} from "msw";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {server} from "../../../test/mocks/server";
import {createWorkout} from "../../../test/fixtures/workouts";
import {useWorkouts} from "./useWorkouts";

describe("useWorkouts", () => {
    test("keeps workouts sorted by performed date after creating and rescheduling one", async () => {
        const oldest = {
            ...createWorkout({
                id: "123e4567-e89b-42d3-a456-426614174011",
                name: "Oldest",
                performedAt: "2026-07-20T00:00:00.000Z",
            }),
            _count: {workoutExercises: 1},
        };
        const newest = {
            ...createWorkout({name: "Newest", performedAt: "2026-07-26T00:00:00.000Z"}),
            _count: {workoutExercises: 1},
        };
        const historical = createWorkout({
            id: "123e4567-e89b-42d3-a456-426614174012",
            name: "Historical",
            performedAt: "2026-07-22T00:00:00.000Z",
        });
        server.use(
            http.get(`${API_URL}/workouts`, () => HttpResponse.json({workouts: [newest, oldest]})),
            http.post(`${API_URL}/workouts`, () =>
                HttpResponse.json({workout: historical}, {status: 201}),
            ),
            http.patch(`${API_URL}/workouts/${oldest.id}`, () =>
                HttpResponse.json({
                    workout: {...oldest, performedAt: "2026-07-28T00:00:00.000Z"},
                }),
            ),
        );
        const {result} = renderHook(() => useWorkouts());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(() => result.current.create({name: "Historical", performedAt: "2026-07-22"}));
        expect(result.current.workouts.map(({name}) => name)).toEqual([
            "Newest",
            "Historical",
            "Oldest",
        ]);

        await act(() => result.current.update(oldest.id, {performedAt: "2026-07-28"}));
        expect(result.current.workouts.map(({name}) => name)).toEqual([
            "Oldest",
            "Newest",
            "Historical",
        ]);
    });

    test("keeps the newest result when load requests overlap", async () => {
        let attempts = 0;
        const older = {...createWorkout({name: "Older response"}), _count: {workoutExercises: 1}};
        const newer = {...createWorkout({name: "Newer response"}), _count: {workoutExercises: 1}};
        server.use(
            http.get(`${API_URL}/workouts`, async () => {
                attempts += 1;
                if (attempts === 1) {
                    await delay(50);
                    return HttpResponse.json({workouts: [older]});
                }
                return HttpResponse.json({workouts: [newer]});
            }),
        );
        const {result} = renderHook(() => useWorkouts());
        await waitFor(() => expect(attempts).toBe(1));

        act(() => result.current.retry());

        await waitFor(() => expect(result.current.workouts[0]?.name).toBe("Newer response"));
        await act(() => delay(60));
        expect(result.current.workouts[0]?.name).toBe("Newer response");
    });

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
