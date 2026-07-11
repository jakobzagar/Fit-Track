import type {Request, Response} from "express";
import {
    addExerciseToWorkoutService,
    addSetToWorkoutExerciseService,
} from "./workout-exercise.service.js";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    WorkoutIdParams,
    WorkoutSetParams,
} from "./workout-exercise.schema.js";

export async function addExerciseToWorkout(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;
    const body = res.locals.body as AddExerciseToWorkoutInput;

    const workoutExercise = await addExerciseToWorkoutService(
        res.locals.userId,
        params.workoutId,
        body,
    );

    res.status(201).json({
        workoutExercise,
    });
}

export async function addSetToWorkoutExercise(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutSetParams;
    const body = res.locals.body as CreateWorkoutSetInput;

    const workoutExerciseSet = await addSetToWorkoutExerciseService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        body,
    );

    res.status(201).json({
        workoutExerciseSet,
    });
}
