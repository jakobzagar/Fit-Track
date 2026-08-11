import {useEffect} from "react";
import {act, render, waitFor} from "@testing-library/react";
import {delay, http, HttpResponse} from "msw";
import {createMemoryRouter, RouterProvider, useNavigate, useParams} from "react-router";
import {describe, expect, test, vi} from "vitest";
import {AppProviders} from "../../../../app/providers";
import {API_URL} from "../../../../test/constants";
import {server} from "../../../../test/mocks/server";
import {
    createWorkout,
    exercise,
    workoutExerciseId,
    workoutId,
    workoutSet,
} from "../../../../test/fixtures/workouts";
import {useWorkoutSession} from "./useWorkoutSession";

type SessionState = ReturnType<typeof useWorkoutSession>;

function renderSessionHook(confirm = vi.fn().mockResolvedValue(false)) {
    let current: SessionState | undefined;
    function Harness() {
        const {workoutId: id} = useParams();
        const state = useWorkoutSession(id, useNavigate(), confirm);
        useEffect(() => {
            current = state;
        }, [state]);
        return null;
    }
    const router = createMemoryRouter(
        [
            {path: "/workouts/:workoutId/session", element: <Harness />},
            {path: "/workouts/:workoutId", element: <p>Details</p>},
        ],
        {initialEntries: [`/workouts/${workoutId}/session`]},
    );
    render(
        <AppProviders>
            <RouterProvider router={router} />
        </AppProviders>,
    );
    return {
        get current() {
            return current;
        },
        router,
        confirm,
    };
}

function mockLoadRequests() {
    server.use(
        http.get(`${API_URL}/workouts/${workoutId}`, () =>
            HttpResponse.json({workout: createWorkout()}),
        ),
        http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
        http.get(`${API_URL}/workouts/${workoutId}/previous-performances`, () =>
            HttpResponse.json({previousPerformances: []}),
        ),
    );
}

describe("useWorkoutSession", () => {
    test("ignores stale session data after navigating to another workout", async () => {
        const nextWorkoutId = "123e4567-e89b-42d3-a456-426614174099";
        server.use(
            http.get(`${API_URL}/workouts/:id`, async ({params}) => {
                if (params.id === workoutId) await delay(50);
                return HttpResponse.json({
                    workout: createWorkout({
                        id: String(params.id),
                        name: params.id === workoutId ? "Old session" : "Current session",
                    }),
                });
            }),
            http.get(`${API_URL}/exercises`, () => HttpResponse.json({exercises: [exercise]})),
            http.get(`${API_URL}/workouts/:id/previous-performances`, () =>
                HttpResponse.json({previousPerformances: []}),
            ),
        );
        const hook = renderSessionHook();

        await act(() => hook.router.navigate(`/workouts/${nextWorkoutId}/session`));

        await waitFor(() => expect(hook.current?.workout?.name).toBe("Current session"));
        await act(() => delay(60));
        expect(hook.current?.workout?.name).toBe("Current session");
        expect(hook.router.state.location.pathname).toBe(`/workouts/${nextWorkoutId}/session`);
    });

    test("keeps the session open when clean exit is cancelled", async () => {
        mockLoadRequests();
        const hook = renderSessionHook();
        await waitFor(() => expect(hook.current?.isLoading).toBe(false));

        act(() => hook.current?.exit());
        await waitFor(() => expect(hook.confirm).toHaveBeenCalledOnce());

        expect(hook.router.state.location.pathname).toBe(`/workouts/${workoutId}/session`);
    });

    test("does not append a set when creation fails", async () => {
        mockLoadRequests();
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`, () =>
                HttpResponse.json({message: "Set rejected"}, {status: 422}),
            ),
        );
        const hook = renderSessionHook();
        await waitFor(() => expect(hook.current?.isLoading).toBe(false));

        await expect(
            act(() => hook.current?.addSet(workoutExerciseId, {reps: 10, weight: 80})),
        ).rejects.toThrow("Set rejected");
        expect(hook.current?.workout?.workoutExercises[0].sets).toHaveLength(1);
    });

    test("keeps a set unchanged when saving fails", async () => {
        mockLoadRequests();
        server.use(
            http.patch(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSet.id}`,
                () => HttpResponse.json({message: "Set update rejected"}, {status: 422}),
            ),
        );
        const hook = renderSessionHook();
        await waitFor(() => expect(hook.current?.isLoading).toBe(false));

        await expect(
            act(() =>
                hook.current?.saveSet(workoutExerciseId, workoutSet.id, {
                    reps: 12,
                    weight: 80,
                    durationSeconds: null,
                }),
            ),
        ).rejects.toThrow("Set update rejected");

        expect(hook.current?.workout?.workoutExercises[0].sets[0]).toEqual(workoutSet);
    });

    test("keeps completion unchanged when toggling a set fails", async () => {
        mockLoadRequests();
        server.use(
            http.patch(
                `${API_URL}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSet.id}/completion`,
                () => HttpResponse.json({message: "Completion rejected"}, {status: 409}),
            ),
        );
        const hook = renderSessionHook();
        await waitFor(() => expect(hook.current?.isLoading).toBe(false));

        await expect(
            act(() =>
                hook.current?.toggleSet(workoutExerciseId, workoutSet.id, true, {
                    reps: 8,
                    weight: 80,
                    durationSeconds: null,
                }),
            ),
        ).rejects.toThrow("Completion rejected");

        expect(hook.current?.workout?.workoutExercises[0].sets[0].completedAt).toBeNull();
        expect(hook.current?.completedSetCount).toBe(0);
    });

    test("reports an add-exercise failure without changing the session", async () => {
        mockLoadRequests();
        server.use(
            http.post(`${API_URL}/workouts/${workoutId}/exercises`, () =>
                HttpResponse.json({message: "Exercise already exists"}, {status: 409}),
            ),
        );
        const hook = renderSessionHook();
        await waitFor(() => expect(hook.current?.isLoading).toBe(false));

        let caught: unknown;
        await act(async () => {
            try {
                await hook.current?.addExercise({exerciseId: exercise.id});
            } catch (error) {
                caught = error;
            }
        });

        expect(caught).toEqual(expect.objectContaining({message: "Exercise already exists"}));
        expect(hook.current?.workout?.workoutExercises).toHaveLength(1);
        expect(hook.current?.error).toBe("Exercise already exists");
    });
});
