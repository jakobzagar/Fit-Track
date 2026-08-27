import {Router} from "express";
import {authenticate} from "../../auth/middleware/auth.middleware.js";
import {validate} from "../../../common/middleware/validate.middleware.js";
import {
    getExercises,
    getExerciseById,
    createExercise,
    updateExerciseById,
    archiveExercise,
    restoreExerciseById,
} from "../controllers/exercise.controller.js";
import {
    createExerciseSchema,
    updateExerciseSchema,
    exerciseIdSchema,
    getExercisesQuerySchema,
} from "@fit-track/shared/exercises";

const router = Router();

router.use(authenticate);

router.get("/", validate(getExercisesQuerySchema, "query"), getExercises);

router.get("/:exerciseId", validate(exerciseIdSchema, "params"), getExerciseById);

router.post("/", validate(createExerciseSchema), createExercise);

router.delete("/:exerciseId", validate(exerciseIdSchema, "params"), archiveExercise);

router.patch("/:exerciseId/restore", validate(exerciseIdSchema, "params"), restoreExerciseById);

router.patch(
    "/:exerciseId",
    validate(exerciseIdSchema, "params"),
    validate(updateExerciseSchema),
    updateExerciseById,
);

export default router;
