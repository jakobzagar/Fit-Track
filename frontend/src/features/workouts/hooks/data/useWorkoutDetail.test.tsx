import {act, renderHook, waitFor} from "@testing-library/react";
import {delay, http, HttpResponse} from "msw";
import {describe, expect, test, vi} from "vitest";
import {API_URL} from "../../../../test/constants";
import {server} from "../../../../test/mocks/server";
import {
    createWorkout,
    exercise,
    workoutExercise,
    workoutExerciseId,
    workoutId,
} from "../../../../test/fixtures/workouts";
import {useWorkoutDetail} from "./useWorkoutDetail";

function mockLoadRequests(workout = createWorkout()) {
    server.use(
        http.get(`${API_URL}/workouts/${workoutId}`, () => HttpResponse.json({workout})),
        http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
    );
}

describe("useWorkoutDetail", () => {
    test("ignores a stale response after the workout ID changes", async () => {
        const nextWorkoutId = "123e4567-e89b-42d3-a456-426614174099";
        server.use(
            http.get(`${API_URL}/workouts/:id`, async ({params}) => {
                if (params.id === workoutId) await delay(50);
                return HttpResponse.json({
                    workout: createWorkout({
                        id: String(params.id),
                        name: params.id === workoutId ? "Old workout" : "Current workout",
                    }),
                });
            }),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
        );
        const {result, rerender} = renderHook(({id}) => useWorkoutDetail(id, vi.fn()), {
            initialProps: {id: workoutId},
        });

        rerender({id: nextWorkoutId});

        await waitFor(() => expect(result.current.workout?.name).toBe("Current workout"));
        await act(() => delay(60));
        expect(result.current.workout?.name).toBe("Current workout");
    });

    test("keeps workout state unchanged when adding an exercise fails", async () => {
        mockLoadRequests();
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/exercises`, () =>
                HttpResponse.json({message: "Exercise already added"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() => useWorkoutDetail(workoutId, vi.fn()));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.addExercise({exerciseId: exercise.id});
            } catch (error) {
                caught = error;
            }
        });

        expect(caught).toEqual(expect.objectContaining({message: "Exercise already added"}));
        expect(result.current.workout?.workoutExercises).toHaveLength(1);
        expect(result.current.mutationError).toBe("Exercise already added");
    });

    test("does not delete an exercise when confirmation is cancelled", async () => {
        mockLoadRequests();
        const confirm = vi.fn().mockResolvedValue(false);
        const {result} = renderHook(() => useWorkoutDetail(workoutId, confirm));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(() => result.current.removeExercise(workoutExerciseId));

        expect(confirm).toHaveBeenCalledOnce();
        expect(result.current.workout?.workoutExercises).toHaveLength(1);
    });

    test("reorders surrounding exercises after a position update", async () => {
        const second = {
            ...workoutExercise,
            id: "123e4567-e89b-42d3-a456-426614174022",
            exerciseId: "123e4567-e89b-42d3-a456-426614174002",
            position: 2,
            exercise: {
                ...workoutExercise.exercise,
                id: "123e4567-e89b-42d3-a456-426614174002",
                name: "Row",
            },
        };
        mockLoadRequests(createWorkout({workoutExercises: [workoutExercise, second]}));
        server.use(
            http.patch(`${API_URL}/workouts/${workoutId}/exercises/${second.id}`, () =>
                HttpResponse.json({workoutExercise: {...second, position: 1}}),
            ),
        );
        const {result} = renderHook(() => useWorkoutDetail(workoutId, vi.fn()));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => result.current.setEditingWorkoutExercise(second));
        await act(() => result.current.updateExercise({position: 1}));

        expect(result.current.workout?.workoutExercises.map((item) => item.id)).toEqual([
            second.id,
            workoutExercise.id,
        ]);
        expect(result.current.workout?.workoutExercises.map((item) => item.position)).toEqual([
            1, 2,
        ]);
    });

    test("preserves the selected exercise when an update fails", async () => {
        mockLoadRequests();
        server.use(
            http.patch(`${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}`, () =>
                HttpResponse.json({message: "Position unavailable"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() => useWorkoutDetail(workoutId, vi.fn()));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        act(() => result.current.setEditingWorkoutExercise(workoutExercise));

        let caught: unknown;
        await act(async () => {
            try {
                await result.current.updateExercise({position: 2});
            } catch (error) {
                caught = error;
            }
        });

        expect(caught).toEqual(expect.objectContaining({message: "Position unavailable"}));
        expect(result.current.editingWorkoutExercise?.id).toBe(workoutExerciseId);
        expect(result.current.workout?.workoutExercises[0].position).toBe(1);
        expect(result.current.mutationError).toBe("Position unavailable");
    });

    test("keeps an exercise and clears pending state when removal fails", async () => {
        mockLoadRequests();
        server.use(
            http.delete(`${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}`, () =>
                HttpResponse.json({message: "Exercise cannot be removed"}, {status: 409}),
            ),
        );
        const {result} = renderHook(() =>
            useWorkoutDetail(workoutId, vi.fn().mockResolvedValue(true)),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(() => result.current.removeExercise(workoutExerciseId));

        expect(result.current.workout?.workoutExercises).toHaveLength(1);
        expect(result.current.deletingWorkoutExerciseId).toBeNull();
        expect(result.current.mutationError).toBe("Exercise cannot be removed");
    });
});
