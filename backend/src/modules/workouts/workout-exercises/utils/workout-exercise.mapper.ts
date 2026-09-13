interface WorkoutExerciseSnapshotFields {
    exerciseName: string;
    exerciseMuscleGroup: string;
    exerciseEquipment: string | null;
}

export function toWorkoutExerciseResponse<T extends WorkoutExerciseSnapshotFields>(
    workoutExercise: T,
) {
    const {exerciseName, exerciseMuscleGroup, exerciseEquipment, ...record} = workoutExercise;

    return {
        ...record,
        exerciseSnapshot: {
            name: exerciseName,
            muscleGroup: exerciseMuscleGroup,
            equipment: exerciseEquipment,
        },
    };
}
