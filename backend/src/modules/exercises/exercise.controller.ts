import type {Request, Response} from "express";
import {
    getExercisesService,
    getExerciseByIdService,
    createExerciseService,
    deleteExerciseByIdService,
    updateExerciseByIdService,
    restoreExerciseByIdService,
} from "./exercise.service.js";
import type {
    CreateExerciseInput,
    ExerciseIdParams,
    GetExercisesQuery,
    UpdateExerciseInput,
} from "./exercise.schema.js";

export async function getExercises(_req: Request, res: Response) {
    const query = res.locals.query as GetExercisesQuery;

    const exercises = await getExercisesService(res.locals.userId, query);

    res.status(200).json({
        exercises,
    });
}

export async function getExerciseById(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;

    const exercise = await getExerciseByIdService(res.locals.userId, params.exerciseId);

    res.status(200).json({
        exercise,
    });
}

export async function createExercise(_req: Request, res: Response) {
    const body = res.locals.body as CreateExerciseInput;

    const exercise = await createExerciseService(res.locals.userId, body);

    res.status(201).json({
        exercise,
    });
}

export async function deleteExerciseById(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;

    const exercise = await deleteExerciseByIdService(res.locals.userId, params.exerciseId);

    res.status(200).json({
        exercise,
    });
}

export async function restoreExerciseById(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;

    const exercise = await restoreExerciseByIdService(res.locals.userId, params.exerciseId);

    res.status(200).json({
        exercise,
    });
}

export async function updateExerciseById(_req: Request, res: Response) {
    const params = res.locals.params as ExerciseIdParams;
    const body = res.locals.body as UpdateExerciseInput;

    const exercise = await updateExerciseByIdService(res.locals.userId, params.exerciseId, body);

    res.status(200).json({
        exercise,
    });
}
