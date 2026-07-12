import {apiRequest} from "../../../lib/api.client.ts";
import type {
    CreateWorkoutResponse,
    PreviousPerformancesResponse,
    WorkoutResponse,
    WorkoutsResponse,
} from "../workout.types.ts";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import {
    createWorkoutResponseSchema,
    deleteWorkoutResponseSchema,
    workoutResponseSchema,
    workoutsResponseSchema,
    previousPerformancesResponseSchema,
} from "../schemas/workout.response.schemas.ts";

interface DeleteWorkoutResponse {
    message: string;
}

export function getWorkouts(): Promise<WorkoutsResponse> {
    return apiRequest("/workouts", workoutsResponseSchema);
}

export function getWorkoutById(workoutId: string): Promise<WorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}`, workoutResponseSchema);
}

export function createWorkout(data: CreateWorkoutInput): Promise<CreateWorkoutResponse> {
    return apiRequest("/workouts", createWorkoutResponseSchema, {
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
): Promise<CreateWorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}`, createWorkoutResponseSchema, {
        method: "PATCH",
        body: data,
    });
}

export function startWorkout(workoutId: string): Promise<CreateWorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}/start`, createWorkoutResponseSchema, {
        method: "POST",
    });
}

export function finishWorkout(workoutId: string): Promise<CreateWorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}/finish`, createWorkoutResponseSchema, {
        method: "POST",
    });
}

export function getPreviousPerformances(workoutId: string): Promise<PreviousPerformancesResponse> {
    return apiRequest(
        `/workouts/${workoutId}/previous-performances`,
        previousPerformancesResponseSchema,
    );
}
