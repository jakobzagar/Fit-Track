import {
    addExerciseToWorkoutResponseSchema,
    addSetToWorkoutExerciseResponseSchema,
    deleteWorkoutExerciseResponseSchema,
    deleteWorkoutSetResponseSchema,
    workoutExerciseResponseSchema,
    workoutSetResponseSchema,
} from "@fit-track/shared/workout-exercises";
import {apiRequest} from "../../../lib/api.client.ts";
import type {
    AddExerciseToWorkoutResponse,
    AddSetToWorkoutExerciseResponse,
    DeleteWorkoutExerciseResponse,
    DeleteWorkoutSetResponse,
    WorkoutExerciseResponse,
    WorkoutSetResponse,
} from "../workout.exercises.types.ts";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
} from "../schemas/workout.exercises.schemas.ts";

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
    setId: string,
    data: UpdateWorkoutSetInput,
): Promise<WorkoutSetResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`,
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
    setId: string,
): Promise<DeleteWorkoutSetResponse> {
    return apiRequest(
        `/workouts/${workoutId}/exercises/${workoutExerciseId}/sets/${setId}`,
        deleteWorkoutSetResponseSchema,
        {
            method: "DELETE",
        },
    );
}
