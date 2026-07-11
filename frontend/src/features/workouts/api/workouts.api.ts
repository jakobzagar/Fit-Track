import {apiRequest} from "../../../lib/api.client.ts";
import type {CreateWorkoutResponse, WorkoutResponse, WorkoutsResponse} from "../workout.types.ts";
import type {CreateWorkoutInput, UpdateWorkoutInput} from "../schemas/workout.schemas.ts";
import {
    createWorkoutResponseSchema,
    deleteWorkoutResponseSchema,
    workoutResponseSchema,
    workoutsResponseSchema,
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
): Promise<WorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}`, workoutResponseSchema, {
        method: "PATCH",
        body: data,
    });
}
