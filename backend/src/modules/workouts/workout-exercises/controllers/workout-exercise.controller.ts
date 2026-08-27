import type {Request, Response} from "express";
import {
    addExerciseToWorkoutService,
    deleteWorkoutExerciseService,
    updateWorkoutExerciseService,
} from "../services/workout-exercise.service.js";
import {
    addSetToWorkoutExerciseService,
    deleteWorkoutSetService,
    updateWorkoutSetService,
    setWorkoutSetCompletionService,
} from "../services/workout-set.service.js";
import type {
    AddExerciseToWorkoutInput,
    CreateWorkoutSetInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSetInput,
    SetWorkoutSetCompletionInput,
    WorkoutSetIdParams,
    WorkoutExerciseParams,
    WorkoutIdParams,
} from "@fit-track/shared/workouts";

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
    const params = res.locals.params as WorkoutExerciseParams;
    const body = res.locals.body as CreateWorkoutSetInput;

    const workoutSet = await addSetToWorkoutExerciseService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        body,
    );

    res.status(201).json({
        workoutSet,
    });
}

export async function updateWorkoutExercise(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutExerciseParams;
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
    const params = res.locals.params as WorkoutExerciseParams;

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

    const workoutSet = await updateWorkoutSetService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        params.workoutSetId,
        body,
    );

    res.status(200).json({
        workoutSet,
    });
}

export async function deleteWorkoutSet(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutSetIdParams;

    await deleteWorkoutSetService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        params.workoutSetId,
    );

    res.status(200).json({
        message: "Workout set deleted successfully",
    });
}

export async function setWorkoutSetCompletion(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutSetIdParams;
    const body = res.locals.body as SetWorkoutSetCompletionInput;

    const workoutSet = await setWorkoutSetCompletionService(
        res.locals.userId,
        params.workoutId,
        params.workoutExerciseId,
        params.workoutSetId,
        body,
    );

    res.status(200).json({
        workoutSet,
    });
}
