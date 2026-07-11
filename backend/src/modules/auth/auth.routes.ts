import {Router} from "express";
import {
    registerController,
    logInController,
    logOutController,
    getMeController,
} from "./auth.controller.js";
import {validate} from "../../common/middleware/validate.middleware.js";
import {authenticate} from "./auth.middleware.js";
import {registerSchema, loginSchema} from "./auth.schema.js";
import {
    loginRateLimiter,
    registerRateLimiter,
} from "../../common/middleware/rate-limit.middleware.js";

const router = Router();

router.get("/me", authenticate, getMeController);

router.post("/register", registerRateLimiter, validate(registerSchema), registerController);
router.post("/login", loginRateLimiter, validate(loginSchema), logInController);
router.post("/logout", logOutController);

export default router;
