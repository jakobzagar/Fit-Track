import type {NextFunction, Request, Response} from "express";
import {env} from "../../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CLIENT_ORIGIN = new URL(env.clientUrl).origin;

export function verifyCsrfOrigin(req: Request, res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method)) {
        next();
        return;
    }

    const origin = req.get("origin");

    if (origin !== CLIENT_ORIGIN) {
        res.status(403).json({
            message: "Invalid request origin",
        });
        return;
    }

    next();
}
