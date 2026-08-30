import {apiRequest} from "../../../lib/api/api.client";
import type {
    CreateWorkoutInput,
    DeleteWorkoutResponse,
    PreviousPerformancesResponse,
    UpdateWorkoutInput,
    WorkoutRecordResponse,
    WorkoutResponse,
    WorkoutsResponse,
} from "@fit-track/shared/workouts";
import {
    deleteWorkoutResponseSchema,
    workoutRecordResponseSchema,
    workoutResponseSchema,
    workoutsResponseSchema,
    previousPerformancesResponseSchema,
} from "@fit-track/shared/workouts";

export function getWorkouts(): Promise<WorkoutsResponse> {
    return apiRequest("/workouts", workoutsResponseSchema);
}

export function getWorkoutById(workoutId: string): Promise<WorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}`, workoutResponseSchema);
}

export function createWorkout(data: CreateWorkoutInput): Promise<WorkoutRecordResponse> {
    return apiRequest("/workouts", workoutRecordResponseSchema, {
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
): Promise<WorkoutRecordResponse> {
    return apiRequest(`/workouts/${workoutId}`, workoutRecordResponseSchema, {
        method: "PATCH",
        body: data,
    });
}

export function startWorkout(workoutId: string): Promise<WorkoutRecordResponse> {
    return apiRequest(`/workouts/${workoutId}/start`, workoutRecordResponseSchema, {
        method: "POST",
    });
}

export function finishWorkout(workoutId: string): Promise<WorkoutRecordResponse> {
    return apiRequest(`/workouts/${workoutId}/finish`, workoutRecordResponseSchema, {
        method: "POST",
    });
}

export function cancelWorkout(workoutId: string): Promise<WorkoutRecordResponse> {
    return apiRequest(`/workouts/${workoutId}/cancel`, workoutRecordResponseSchema, {
        method: "POST",
    });
}

export function reopenWorkout(workoutId: string): Promise<WorkoutRecordResponse> {
    return apiRequest(`/workouts/${workoutId}/reopen`, workoutRecordResponseSchema, {
        method: "POST",
    });
}

export function getPreviousPerformances(workoutId: string): Promise<PreviousPerformancesResponse> {
    return apiRequest(
        `/workouts/${workoutId}/previous-performances`,
        previousPerformancesResponseSchema,
    );
}
