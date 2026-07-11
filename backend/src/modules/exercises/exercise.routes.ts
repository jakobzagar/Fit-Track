import {Router} from "express";
import {authenticate} from "../auth/auth.middleware.js";
import {validate} from "../../common/middleware/validate.middleware.js";
import {
    getExercises,
    getExerciseById,
    createExercise,
    updateExerciseById,
    deleteExerciseById,
    restoreExerciseById,
} from "./exercise.controller.js";
import {
    createExerciseSchema,
    updateExerciseSchema,
    exerciseIdSchema,
    getExercisesQuerySchema,
} from "./exercise.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(getExercisesQuerySchema, "query"), getExercises);

router.get("/:exerciseId", validate(exerciseIdSchema, "params"), getExerciseById);

router.post("/", validate(createExerciseSchema), createExercise);

router.delete("/:exerciseId", validate(exerciseIdSchema, "params"), deleteExerciseById);

router.patch("/:exerciseId/restore", validate(exerciseIdSchema, "params"), restoreExerciseById);

router.patch(
    "/:exerciseId",
    validate(exerciseIdSchema, "params"),
    validate(updateExerciseSchema),
    updateExerciseById,
);

export default router;
