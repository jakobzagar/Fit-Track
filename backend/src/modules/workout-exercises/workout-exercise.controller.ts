import type {Request, Response} from "express";
import {
    addExerciseToWorkoutService,
    addSetToWorkoutExerciseService,
    deleteWorkoutExerciseService,
    deleteWorkoutSetService,
    updateWorkoutExerciseService,
    updateWorkoutSetService,
} from "./workout-exercise.service.js";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
    WorkoutIdParams,
    WorkoutSetIdParams,
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

export async function updateWorkoutExercise(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutSetParams;
    const body = res.locals.body as UpdateWorkoutExerciseInput;

    const workoutExercise = await updateWorkoutExerciseService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        body,
    );

    res.status(200).json({
        workoutExercise,
    });
}

export async function deleteWorkoutExercise(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutSetParams;

    await deleteWorkoutExerciseService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
    );

    res.status(200).json({
        message: "Workout exercise deleted successfully",
    });
}

export async function updateWorkoutSet(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutSetIdParams;
    const body = res.locals.body as UpdateWorkoutSetInput;

    const workoutExerciseSet = await updateWorkoutSetService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        params.setId,
        body,
    );

    res.status(200).json({
        workoutExerciseSet,
    });
}

export async function deleteWorkoutSet(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutSetIdParams;

    await deleteWorkoutSetService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        params.setId,
    );

    res.status(200).json({
        message: "Workout set deleted successfully",
    });
}
