import {Router} from "express";
import {authenticate} from "../auth/auth.middleware.js";
import {validate} from "../../common/middleware/validate.middleware.js";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
    deleteWorkoutExercise,
    deleteWorkoutSet,
    updateWorkoutExercise,
    updateWorkoutSet,
    setWorkoutSetCompletion,
} from "./workout-exercise.controller.js";
import {
    addExerciseToWorkoutSchema,
    createWorkoutSetSchema,
    updateWorkoutExerciseSchema,
    updateWorkoutSetSchema,
    setWorkoutSetCompletionSchema,
    workoutIdSchema,
    workoutSetIdParamsSchema,
    workoutSetParamsSchema,
} from "@fit-track/shared";

const router = Router();

router.use(authenticate);

router.post(
    "/:workoutId/exercises",
    validate(workoutIdSchema, "params"),
    validate(addExerciseToWorkoutSchema),
    addExerciseToWorkout,
);
router.post(
    "/:workoutId/exercises/:workoutExerciseId/sets",
    validate(workoutSetParamsSchema, "params"),
    validate(createWorkoutSetSchema),
    addSetToWorkoutExercise,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId",
    validate(workoutSetParamsSchema, "params"),
    validate(updateWorkoutExerciseSchema),
    updateWorkoutExercise,
);

router.delete(
    "/:workoutId/exercises/:workoutExerciseId",
    validate(workoutSetParamsSchema, "params"),
    deleteWorkoutExercise,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId/sets/:setId",
    validate(workoutSetIdParamsSchema, "params"),
    validate(updateWorkoutSetSchema),
    updateWorkoutSet,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId/sets/:setId/completion",
    validate(workoutSetIdParamsSchema, "params"),
    validate(setWorkoutSetCompletionSchema),
    setWorkoutSetCompletion,
);

router.delete(
    "/:workoutId/exercises/:workoutExerciseId/sets/:setId",
    validate(workoutSetIdParamsSchema, "params"),
    deleteWorkoutSet,
);

export default router;
