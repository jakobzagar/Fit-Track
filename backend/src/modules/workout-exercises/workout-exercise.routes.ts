import {Router} from "express";
import {authenticate} from "../auth/auth.middleware.js";
import {validate} from "../../common/middleware/validate.middleware.js";
import {addExerciseToWorkout, addSetToWorkoutExercise} from "./workout-exercise.controller.js";
import {
    addExerciseToWorkoutSchema,
    createWorkoutSetSchema,
    workoutIdSchema,
    workoutSetParamsSchema,
} from "./workout-exercise.schema.js";

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

export default router;
