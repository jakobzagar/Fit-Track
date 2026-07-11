import {
    addExerciseToWorkoutResponseSchema,
    addSetToWorkoutExerciseResponseSchema,
} from "@fit-track/shared/workout-exercises";
import {apiRequest} from "../../../lib/api.client.ts";
import type {
    AddExerciseToWorkoutResponse,
    AddSetToWorkoutExerciseResponse,
} from "../workout.exercises.types.ts";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
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
