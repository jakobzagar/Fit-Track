import {Router} from "express";
import {validate} from "../../../../common/middleware/validate.middleware.js";
import {
    addExerciseToWorkoutController,
    addWorkoutSetController,
    deleteWorkoutExerciseController,
    deleteWorkoutSetController,
    updateWorkoutExerciseController,
    updateWorkoutSetController,
    setWorkoutSetCompletionController,
} from "../controllers/workout-exercise.controller.js";
import {
    addExerciseToWorkoutSchema,
    createWorkoutSetSchema,
    updateWorkoutExerciseSchema,
    updateWorkoutSetSchema,
    setWorkoutSetCompletionSchema,
    workoutSetIdParamsSchema,
    workoutExerciseParamsSchema,
    workoutIdSchema,
} from "@fit-track/shared/workouts";

const router = Router();

router.post(
    "/:workoutId/exercises",
    validate(workoutIdSchema, "params"),
    validate(addExerciseToWorkoutSchema),
    addExerciseToWorkoutController,
);
router.post(
    "/:workoutId/exercises/:workoutExerciseId/sets",
    validate(workoutExerciseParamsSchema, "params"),
    validate(createWorkoutSetSchema),
    addWorkoutSetController,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId",
    validate(workoutExerciseParamsSchema, "params"),
    validate(updateWorkoutExerciseSchema),
    updateWorkoutExerciseController,
);

router.delete(
    "/:workoutId/exercises/:workoutExerciseId",
    validate(workoutExerciseParamsSchema, "params"),
    deleteWorkoutExerciseController,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId/sets/:workoutSetId",
    validate(workoutSetIdParamsSchema, "params"),
    validate(updateWorkoutSetSchema),
    updateWorkoutSetController,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId/sets/:workoutSetId/completion",
    validate(workoutSetIdParamsSchema, "params"),
    validate(setWorkoutSetCompletionSchema),
    setWorkoutSetCompletionController,
);

router.delete(
    "/:workoutId/exercises/:workoutExerciseId/sets/:workoutSetId",
    validate(workoutSetIdParamsSchema, "params"),
    deleteWorkoutSetController,
);

export default router;
