import type {Request, Response} from "express";
import {
    getWorkoutsService,
    getWorkoutByIdService,
    createWorkoutService,
    deleteWorkoutService,
    updateWorkoutService,
    getPreviousPerformancesService,
} from "../services/workout.service.js";
import {
    cancelWorkoutService,
    finishWorkoutService,
    reopenWorkoutService,
    startWorkoutService,
} from "../services/workout-lifecycle.service.js";
import type {
    CreateWorkoutInput,
    UpdateWorkoutInput,
    WorkoutIdParams,
} from "@fit-track/shared/workouts";

export async function getWorkoutsController(_req: Request, res: Response) {
    const workouts = await getWorkoutsService(res.locals.userId);

    res.status(200).json({
        workouts,
    });
}

export async function getWorkoutByIdController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    const workout = await getWorkoutByIdService(res.locals.userId, params.workoutId);

    res.status(200).json({
        workout,
    });
}

export async function getPreviousPerformancesController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    const previousPerformances = await getPreviousPerformancesService(
        res.locals.userId,
        params.workoutId,
    );

    res.status(200).json({
        previousPerformances,
    });
}

export async function createWorkoutController(_req: Request, res: Response) {
    const body = res.locals.body as CreateWorkoutInput;

    const workout = await createWorkoutService(res.locals.userId, body);

    res.status(201).json({
        workout,
    });
}

export async function deleteWorkoutController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    await deleteWorkoutService(res.locals.userId, params.workoutId);

    res.status(200).json({
        message: "Workout deleted successfully",
    });
}

export async function updateWorkoutController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;
    const body = res.locals.body as UpdateWorkoutInput;

    const workout = await updateWorkoutService(res.locals.userId, params.workoutId, body);

    res.status(200).json({
        workout,
    });
}

export async function startWorkoutController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    const workout = await startWorkoutService(res.locals.userId, params.workoutId);

    res.status(200).json({
        workout,
    });
}

export async function finishWorkoutController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    const workout = await finishWorkoutService(res.locals.userId, params.workoutId);

    res.status(200).json({
        workout,
    });
}

export async function cancelWorkoutController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    const workout = await cancelWorkoutService(res.locals.userId, params.workoutId);

    res.status(200).json({
        workout,
    });
}

export async function reopenWorkoutController(_req: Request, res: Response) {
    const params = res.locals.params as WorkoutIdParams;

    const workout = await reopenWorkoutService(res.locals.userId, params.workoutId);

    res.status(200).json({
        workout,
    });
}
