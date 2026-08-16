import {apiRequest} from "../../../lib/api/api.client.ts";
import type {
    DeleteWorkoutResponse,
    PreviousPerformancesResponse,
    WorkoutResponse,
    WorkoutsResponse,
    WorkoutBaseResponse,
} from "../types/workout.types.ts";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import {
    deleteWorkoutResponseSchema,
    workoutBaseResponseSchema,
    workoutResponseSchema,
    workoutsResponseSchema,
    previousPerformancesResponseSchema,
} from "../schemas/workout.response.schemas.ts";

export function getWorkouts(): Promise<WorkoutsResponse> {
    return apiRequest("/workouts", workoutsResponseSchema);
}

export function getWorkoutById(workoutId: string): Promise<WorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}`, workoutResponseSchema);
}

export function createWorkout(data: CreateWorkoutInput): Promise<WorkoutBaseResponse> {
    return apiRequest("/workouts", workoutBaseResponseSchema, {
        method: "POST",
        body: data,
    });
}

export function deleteWorkout(workoutId: string): Promise<DeleteWorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}`, deleteWorkoutResponseSchema, {
        method: "DELETE",
    });
}

export function updateWorkout(
    workoutId: string,
    data: UpdateWorkoutInput,
): Promise<WorkoutBaseResponse> {
    return apiRequest(`/workouts/${workoutId}`, workoutBaseResponseSchema, {
        method: "PATCH",
        body: data,
    });
}

export function startWorkout(workoutId: string): Promise<WorkoutBaseResponse> {
    return apiRequest(`/workouts/${workoutId}/start`, workoutBaseResponseSchema, {
        method: "POST",
    });
}

export function finishWorkout(workoutId: string): Promise<WorkoutBaseResponse> {
    return apiRequest(`/workouts/${workoutId}/finish`, workoutBaseResponseSchema, {
        method: "POST",
    });
}

export function cancelWorkout(workoutId: string): Promise<WorkoutBaseResponse> {
    return apiRequest(`/workouts/${workoutId}/cancel`, workoutBaseResponseSchema, {
        method: "POST",
    });
}

export function reopenWorkout(workoutId: string): Promise<WorkoutBaseResponse> {
    return apiRequest(`/workouts/${workoutId}/reopen`, workoutBaseResponseSchema, {
        method: "POST",
    });
}

export function getPreviousPerformances(workoutId: string): Promise<PreviousPerformancesResponse> {
    return apiRequest(
        `/workouts/${workoutId}/previous-performances`,
        previousPerformancesResponseSchema,
    );
}
