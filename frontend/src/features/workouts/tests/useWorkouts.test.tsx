import {act, renderHook, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, test} from "vitest";
import {API_URL} from "../../../test/constants";
import {createDeferred} from "../../../test/deferred";
import {server} from "../../../test/mocks/server";
import {createWorkoutBase, createWorkoutSummary} from "../../../test/fixtures/workouts";
import {useWorkouts} from "../hooks/data/useWorkouts";

describe("useWorkouts", () => {
    test("keeps workouts sorted by performed date after creating and rescheduling one", async () => {
        const oldest = createWorkoutSummary({
            id: "123e4567-e89b-42d3-a456-426614174011",
            name: "Oldest",
            performedAt: "2026-07-20T00:00:00.000Z",
        });
        const newest = createWorkoutSummary({
            name: "Newest",
            performedAt: "2026-07-26T00:00:00.000Z",
        });
        const historical = createWorkoutBase({
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
                    workout: createWorkoutBase({
                        ...oldest,
                        performedAt: "2026-07-28T00:00:00.000Z",
                    }),
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
        const firstRequestStarted = createDeferred();
        const releaseFirstRequest = createDeferred();
        const firstRequestCompleted = createDeferred();
        const older = createWorkoutSummary({name: "Older response"});
        const newer = createWorkoutSummary({name: "Newer response"});
        server.use(
            http.get(`${API_URL}/workouts`, async () => {
                attempts += 1;
                if (attempts === 1) {
                    firstRequestStarted.resolve();
                    await releaseFirstRequest.promise;
                    firstRequestCompleted.resolve();
                    return HttpResponse.json({workouts: [older]});
                }
                return HttpResponse.json({workouts: [newer]});
            }),
        );
        const {result} = renderHook(() => useWorkouts());
        await firstRequestStarted.promise;

        act(() => result.current.retry());

        await waitFor(() => expect(result.current.workouts[0]?.name).toBe("Newer response"));
        await act(async () => {
            releaseFirstRequest.resolve();
            await firstRequestCompleted.promise;
        });
        expect(result.current.workouts[0]?.name).toBe("Newer response");
        expect(attempts).toBe(2);
    });

    test("keeps the existing workout when an update fails", async () => {
        const workout = createWorkoutSummary();
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
        const workout = createWorkoutSummary();
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
