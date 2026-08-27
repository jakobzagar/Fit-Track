import {Router} from "express";
import {validate} from "../../../../common/middleware/validate.middleware.js";
import {
    addExerciseToWorkout,
    addSetToWorkoutExercise,
    deleteWorkoutExercise,
    deleteWorkoutSet,
    updateWorkoutExercise,
    updateWorkoutSet,
    setWorkoutSetCompletion,
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
    addExerciseToWorkout,
);
router.post(
    "/:workoutId/exercises/:workoutExerciseId/sets",
    validate(workoutExerciseParamsSchema, "params"),
    validate(createWorkoutSetSchema),
    addSetToWorkoutExercise,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId",
    validate(workoutExerciseParamsSchema, "params"),
    validate(updateWorkoutExerciseSchema),
    updateWorkoutExercise,
);

router.delete(
    "/:workoutId/exercises/:workoutExerciseId",
    validate(workoutExerciseParamsSchema, "params"),
    deleteWorkoutExercise,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId/sets/:workoutSetId",
    validate(workoutSetIdParamsSchema, "params"),
    validate(updateWorkoutSetSchema),
    updateWorkoutSet,
);

router.patch(
    "/:workoutId/exercises/:workoutExerciseId/sets/:workoutSetId/completion",
    validate(workoutSetIdParamsSchema, "params"),
    validate(setWorkoutSetCompletionSchema),
    setWorkoutSetCompletion,
);

router.delete(
    "/:workoutId/exercises/:workoutExerciseId/sets/:workoutSetId",
    validate(workoutSetIdParamsSchema, "params"),
    deleteWorkoutSet,
);

export default router;
