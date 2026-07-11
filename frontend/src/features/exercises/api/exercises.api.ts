import {exerciseResponseSchema, exercisesResponseSchema} from "@fit-track/shared/exercises";
import {apiRequest} from "../../../lib/api.client.ts";
import type {ExerciseResponse, ExercisesResponse} from "../exercise.types.ts";
import type {CreateExerciseInput, UpdateExerciseInput} from "../schemas/exercise.schemas.ts";

export function getExercises(): Promise<ExercisesResponse> {
    return apiRequest("/exercises", exercisesResponseSchema);
}

export function createExercise(data: CreateExerciseInput): Promise<ExerciseResponse> {
    return apiRequest("/exercises", exerciseResponseSchema, {
        method: "POST",
        body: data,
    });
}

export function archiveExercise(exerciseId: string): Promise<ExerciseResponse> {
    return apiRequest(`/exercises/${exerciseId}`, exerciseResponseSchema, {
        method: "DELETE",
    });
}

export function updateExercise(
    exerciseId: string,
    data: UpdateExerciseInput,
): Promise<ExerciseResponse> {
    return apiRequest(`/exercises/${exerciseId}`, exerciseResponseSchema, {
        method: "PATCH",
        body: data,
    });
}
