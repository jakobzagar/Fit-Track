import type {Exercise} from "../../features/exercises/exercise.types";
import type {Workout, WorkoutExercise, WorkoutSet} from "../../features/workouts/workout.types";

export const userId = "123e4567-e89b-42d3-a456-426614174000";
export const exerciseId = "123e4567-e89b-42d3-a456-426614174001";
export const workoutId = "123e4567-e89b-42d3-a456-426614174010";
export const workoutExerciseId = "123e4567-e89b-42d3-a456-426614174020";
export const workoutSetId = "123e4567-e89b-42d3-a456-426614174030";

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

export const workoutSet: WorkoutSet = {
    id: workoutSetId,
    workoutExerciseId,
    setNumber: 1,
    reps: 8,
    weight: 80,
    durationSeconds: null,
    completedAt: null,
};

export const workoutExercise: WorkoutExercise = {
    id: workoutExerciseId,
    workoutId,
    exerciseId,
    position: 1,
    notes: "Controlled reps",
    exercise: {
        id: exerciseId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
    },
    sets: [workoutSet],
};

export function createWorkout(overrides: Partial<Workout> = {}): Workout {
    return {
        id: workoutId,
        userId,
        name: "Push day",
        status: "ACTIVE",
        performedAt: "2026-07-26T10:00:00.000Z",
        startedAt: "2026-07-26T10:05:00.000Z",
        completedAt: null,
        notes: "Heavy session",
        createdAt: "2026-07-26T10:00:00.000Z",
        updatedAt: "2026-07-26T10:05:00.000Z",
        workoutExercises: [workoutExercise],
        ...overrides,
    };
}
