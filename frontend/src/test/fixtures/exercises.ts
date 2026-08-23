import type {Exercise} from "@fit-track/shared/exercises";

export const userId = "123e4567-e89b-42d3-a456-426614174000";
export const exerciseId = "123e4567-e89b-42d3-a456-426614174001";

export const exercise: Exercise = {
    id: exerciseId,
    userId,
    name: "Bench press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    isArchived: false,
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-26T10:00:00.000Z",
};
