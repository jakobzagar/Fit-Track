import {Router} from "express";
import {
    registerController,
    logInController,
    logOutController,
    getMeController,
} from "../controllers/auth.controller.js";
import {validate} from "../../../common/middleware/validate.middleware.js";
import {authenticate} from "../middleware/auth.middleware.js";
import {registerSchema, loginSchema} from "@fit-track/shared/auth";
import {
    loginRateLimiter,
    registerRateLimiter,
} from "../../../common/middleware/rate-limit.middleware.js";

const router = Router();

router.get("/me", authenticate, getMeController);

router.post("/register", registerRateLimiter, validate(registerSchema), registerController);
router.post("/login", loginRateLimiter, validate(loginSchema), logInController);
router.post("/logout", logOutController);

export default router;
