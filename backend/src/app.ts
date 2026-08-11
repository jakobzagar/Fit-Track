import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import {env} from "./config/env.js";
import {verifyCsrfOrigin} from "./common/middleware/csrf.middleware.js";
import {errorMiddleware} from "./common/middleware/error.middleware.js";
import {apiRateLimiter} from "./common/middleware/rate-limit.middleware.js";
import {apiNotFound} from "./common/middleware/not-found.middleware.js";

import authRoutes from "./modules/auth/auth.routes.js";
import exerciseRoutes from "./modules/exercises/exercise.routes.js";
import workoutRoutes from "./modules/workouts/workout.routes.js";
import workoutExerciseRoutes from "./modules/workout-exercises/workout-exercise.routes.js";
import healthRoutes from "./modules/health/health.routes.js";

export const app = express();

app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);
app.disable("x-powered-by");
app.use(helmet());
app.use(
    cors({
        origin: (origin, callback) =>
            callback(null, origin === undefined || origin === env.clientUrl),
        credentials: true,
    }),
);
app.use(apiRateLimiter);
app.use(express.json({limit: "100kb"}));
app.use(
    express.urlencoded({
        extended: true,
        limit: "100kb",
    }),
);
app.use(cookieParser());
app.use(verifyCsrfOrigin);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/workouts", workoutExerciseRoutes);

app.use("/api", apiNotFound);
app.use(errorMiddleware);
