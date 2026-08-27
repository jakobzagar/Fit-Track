import {
    addExerciseToWorkoutResponseSchema,
    addSetToWorkoutExerciseResponseSchema,
    deleteWorkoutExerciseResponseSchema,
    deleteWorkoutSetResponseSchema,
    workoutExerciseResponseSchema,
    workoutSetResponseSchema,
} from "@fit-track/shared/workouts";
import {apiRequest} from "../../../../lib/api/api.client";
import type {
    AddExerciseToWorkoutInput,
    AddExerciseToWorkoutResponse,
    AddSetToWorkoutExerciseResponse,
    CreateWorkoutSetInput,
    DeleteWorkoutExerciseResponse,
    DeleteWorkoutSetResponse,
    SetWorkoutSetCompletionInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
    WorkoutExerciseResponse,
    WorkoutSetResponse,
} from "@fit-track/shared/workouts";

export function addExerciseToWorkout(
    workoutId: string,
    data: AddExerciseToWorkoutInput,
): Promise<AddExerciseToWorkoutResponse> {
    return apiRequest(`/workouts/${workoutId}/exercises`, addExerciseToWorkoutResponseSchema, {
        method: "POST",
        body: data,
    });
}

export function addSetToWorkoutExercise(
    workoutId: string,
    workoutExerciseId: string,
    data: CreateWorkoutSetInput,
): Promise<AddSetToWorkoutExerciseResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
        addSetToWorkoutExerciseResponseSchema,
        {
            method: "POST",
            body: data,
        },
    );
}

export function updateWorkoutExercise(
    workoutId: string,
    workoutExerciseId: string,
    data: UpdateWorkoutExerciseInput,
): Promise<WorkoutExerciseResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}`,
        workoutExerciseResponseSchema,
        {
            method: "PATCH",
            body: data,
        },
    );
}

export function deleteWorkoutExercise(
    workoutId: string,
    workoutExerciseId: string,
): Promise<DeleteWorkoutExerciseResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}`,
        deleteWorkoutExerciseResponseSchema,
        {
            method: "DELETE",
        },
    );
}

export function updateWorkoutSet(
    workoutId: string,
    workoutExerciseId: string,
    workoutSetId: string,
    data: UpdateWorkoutSetInput,
): Promise<WorkoutSetResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSetId}`,
        workoutSetResponseSchema,
        {
            method: "PATCH",
            body: data,
        },
    );
}

export function deleteWorkoutSet(
    workoutId: string,
    workoutExerciseId: string,
    workoutSetId: string,
): Promise<DeleteWorkoutSetResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSetId}`,
        deleteWorkoutSetResponseSchema,
        {
            method: "DELETE",
        },
    );
}

export function setWorkoutSetCompletion(
    workoutId: string,
    workoutExerciseId: string,
    workoutSetId: string,
    data: SetWorkoutSetCompletionInput,
): Promise<WorkoutSetResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${workoutSetId}/completion`,
        workoutSetResponseSchema,
        {
            method: "PATCH",
            body: data,
        },
    );
}
