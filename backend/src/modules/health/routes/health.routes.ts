import {Router} from "express";
import {getLivenessController, getReadinessController} from "../controllers/health.controller.js";

const router = Router();

router.get("/live", getLivenessController);
router.get("/ready", getReadinessController);

export default router;
