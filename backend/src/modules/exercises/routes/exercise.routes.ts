import {Router} from "express";
import {authenticate} from "../../auth/middleware/auth.middleware.js";
import {validate} from "../../../common/middleware/validate.middleware.js";
import {
    getExercisesController,
    getExerciseByIdController,
    createExerciseController,
    updateExerciseController,
    archiveExerciseController,
    restoreExerciseController,
} from "../controllers/exercise.controller.js";
import {
    createExerciseSchema,
    updateExerciseSchema,
    exerciseIdSchema,
    getExercisesQuerySchema,
} from "@fit-track/shared/exercises";

const router = Router();

router.use(authenticate);

router.get("/", validate(getExercisesQuerySchema, "query"), getExercisesController);

router.get("/:exerciseId", validate(exerciseIdSchema, "params"), getExerciseByIdController);

router.post("/", validate(createExerciseSchema), createExerciseController);

router.delete("/:exerciseId", validate(exerciseIdSchema, "params"), archiveExerciseController);

router.patch(
    "/:exerciseId/restore",
    validate(exerciseIdSchema, "params"),
    restoreExerciseController,
);

router.patch(
    "/:exerciseId",
    validate(exerciseIdSchema, "params"),
    validate(updateExerciseSchema),
    updateExerciseController,
);

export default router;
