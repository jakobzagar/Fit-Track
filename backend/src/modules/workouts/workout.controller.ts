import type {Request, Response} from "express";
import {
    getWorkoutsService,
    getWorkoutByIdService,
    createWorkoutService,
    deleteWorkoutByIdService,
    updateWorkoutByIdService,
} from "./workout.service.js";
import type {CreateWorkoutInput, UpdateWorkoutInput, WorkoutIdParams} from "./workout.schema.js";

export async function getWorkouts(_req: Request, res: Response) {
    const workouts = await getWorkoutsService(res.locals.userId);

    res.status(200).json({
        workouts,
    });
}

export async function getWorkoutById(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    const workout = await getWorkoutByIdService(res.locals.userId, params.workoutId);

    res.status(200).json({
        workout,
    });
}

export async function createWorkout(_req: Request, res: Response) {
    const body = res.locals.body as CreateWorkoutInput;

    const workout = await createWorkoutService(res.locals.userId, body);

    res.status(201).json({
        workout,
    });
}

export async function deleteWorkout(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    await deleteWorkoutByIdService(res.locals.userId, params.workoutId);

    res.status(200).json({
        message: "Workout deleted successfully",
    });
}

export async function updateWorkout(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;
    const body = res.locals.body as UpdateWorkoutInput;

    const workout = await updateWorkoutByIdService(res.locals.userId, params.workoutId, body);

    res.status(200).json({
        workout,
    });
}
