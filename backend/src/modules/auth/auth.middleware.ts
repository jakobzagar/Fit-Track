import type {NextFunction, Request, Response} from "express";
import {env} from "../../config/env.js";
import jwt from "jsonwebtoken";

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({
            message: "Authentication required",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret);

        if (typeof decoded === "string" || typeof decoded.userId !== "string") {
            res.status(401).json({
                message: "Invalid token",
            });
            return;
        }

        res.locals.userId = decoded.userId;
        next();
    } catch {
        res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
