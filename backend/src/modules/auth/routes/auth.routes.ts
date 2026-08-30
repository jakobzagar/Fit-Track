import {Router} from "express";
import {
    registerController,
    loginController,
    logoutController,
    getCurrentUserController,
} from "../controllers/auth.controller.js";
import {validate} from "../../../common/middleware/validate.middleware.js";
import {authenticate} from "../middleware/auth.middleware.js";
import {registerSchema, loginSchema} from "@fit-track/shared/auth";
import {
    loginRateLimiter,
    registerRateLimiter,
} from "../../../common/middleware/rate-limit.middleware.js";

const router = Router();

router.get("/me", authenticate, getCurrentUserController);

router.post("/register", registerRateLimiter, validate(registerSchema), registerController);
router.post("/login", loginRateLimiter, validate(loginSchema), loginController);
router.post("/logout", logoutController);

export default router;
