import {Router} from "express";
import {authenticate} from "../auth/auth.middleware.js";
import {
    getWorkouts,
    getWorkoutById,
    createWorkout,
    deleteWorkout,
    updateWorkout,
} from "./workout.controller.js";
import {validate} from "../../common/middleware/validate.middleware.js";
import {createWorkoutSchema, updateWorkoutSchema, workoutIdSchema} from "./workout.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", getWorkouts);
router.get("/:workoutId", validate(workoutIdSchema, "params"), getWorkoutById);

router.post("/", validate(createWorkoutSchema), createWorkout);

router.delete("/:workoutId", validate(workoutIdSchema, "params"), deleteWorkout);

router.patch(
    "/:workoutId",
    validate(workoutIdSchema, "params"),
    validate(updateWorkoutSchema),
    updateWorkout,
);

export default router;
