import type {
    Workout,
    WorkoutBase,
    WorkoutExercise,
    WorkoutSet,
    WorkoutSummary,
} from "../../features/workouts/types/workout.types";
import {exercise, exerciseId, userId} from "./exercises";

export {exercise, exerciseId, userId} from "./exercises";

export const workoutId = "123e4567-e89b-42d3-a456-426614174010";
export const workoutExerciseId = "123e4567-e89b-42d3-a456-426614174020";
export const workoutSetId = "123e4567-e89b-42d3-a456-426614174030";

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

export function createWorkoutSummary(overrides: Partial<WorkoutSummary> = {}): WorkoutSummary {
    const workout = createWorkoutBase();

    return {
        ...workout,
        _count: {workoutExercises: 1},
        ...overrides,
    };
}

export function createWorkoutBase(
    overrides: Partial<WorkoutBase> & {workoutExercises?: unknown; _count?: unknown} = {},
): WorkoutBase {
    const {workoutExercises: _workoutExercises, ...workout} = createWorkout();
    const {
        workoutExercises: _overriddenWorkoutExercises,
        _count: _overriddenCount,
        ...baseOverrides
    } = overrides;
    return {...workout, ...baseOverrides};
}
