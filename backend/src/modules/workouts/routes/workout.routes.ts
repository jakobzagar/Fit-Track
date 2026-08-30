import {Router} from "express";
import {authenticate} from "../../auth/middleware/auth.middleware.js";
import workoutExerciseRoutes from "../workout-exercises/routes/workout-exercise.routes.js";
import {
    getWorkoutsController,
    getWorkoutByIdController,
    createWorkoutController,
    deleteWorkoutController,
    updateWorkoutController,
    startWorkoutController,
    finishWorkoutController,
    cancelWorkoutController,
    reopenWorkoutController,
    getPreviousPerformancesController,
} from "../controllers/workout.controller.js";
import {validate} from "../../../common/middleware/validate.middleware.js";
import {
    createWorkoutSchema,
    updateWorkoutSchema,
    workoutIdSchema,
} from "@fit-track/shared/workouts";

const router = Router();

router.use(authenticate);
router.use(workoutExerciseRoutes);

router.get("/", getWorkoutsController);

router.get("/:workoutId", validate(workoutIdSchema, "params"), getWorkoutByIdController);

router.get(
    "/:workoutId/previous-performances",
    validate(workoutIdSchema, "params"),
    getPreviousPerformancesController,
);

router.post("/", validate(createWorkoutSchema), createWorkoutController);

router.post("/:workoutId/start", validate(workoutIdSchema, "params"), startWorkoutController);

router.post("/:workoutId/finish", validate(workoutIdSchema, "params"), finishWorkoutController);

router.post("/:workoutId/cancel", validate(workoutIdSchema, "params"), cancelWorkoutController);

router.post("/:workoutId/reopen", validate(workoutIdSchema, "params"), reopenWorkoutController);

router.delete("/:workoutId", validate(workoutIdSchema, "params"), deleteWorkoutController);

router.patch(
    "/:workoutId",
    validate(workoutIdSchema, "params"),
    validate(updateWorkoutSchema),
    updateWorkoutController,
);

export default router;
