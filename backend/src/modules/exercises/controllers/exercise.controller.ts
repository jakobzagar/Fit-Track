import type {Request, Response} from "express";
import {
    getExercisesService,
    getExerciseByIdService,
    createExerciseService,
    archiveExerciseService,
    updateExerciseService,
    restoreExerciseService,
} from "../services/exercise.service.js";
import type {
    CreateExerciseInput,
    ExerciseIdParams,
    GetExercisesQuery,
    UpdateExerciseInput,
} from "@fit-track/shared/exercises";

export async function getExercisesController(_req: Request, res: Response) {
    const query = res.locals.query as GetExercisesQuery;

    const exercises = await getExercisesService(res.locals.userId, query);

    res.status(200).json({
        exercises,
    });
}

export async function getExerciseByIdController(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;

    const exercise = await getExerciseByIdService(res.locals.userId, params.exerciseId);

    res.status(200).json({
        exercise,
    });
}

export async function createExerciseController(_req: Request, res: Response) {
    const body = res.locals.body as CreateExerciseInput;

    const exercise = await createExerciseService(res.locals.userId, body);

    res.status(201).json({
        exercise,
    });
}

export async function archiveExerciseController(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;

    const exercise = await archiveExerciseService(res.locals.userId, params.exerciseId);

    res.status(200).json({
        exercise,
    });
}

export async function restoreExerciseController(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;

    const exercise = await restoreExerciseService(res.locals.userId, params.exerciseId);

    res.status(200).json({
        exercise,
    });
}

export async function updateExerciseController(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;
    const body = res.locals.body as UpdateExerciseInput;

    const exercise = await updateExerciseService(res.locals.userId, params.exerciseId, body);

    res.status(200).json({
        exercise,
    });
}
