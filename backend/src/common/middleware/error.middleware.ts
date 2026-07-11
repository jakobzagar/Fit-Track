import type {NextFunction, Request, Response} from "express";
import {Prisma} from "../../../generated/prisma/client.js";
import {AppError} from "../errors/app.error.js";

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            message: error.message,
        });
        return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            res.status(409).json({
                message: "Resource already exists",
            });
            return;
        }

        if (error.code === "P2025") {
            res.status(404).json({
                message: "Resource not found",
            });
            return;
        }

        if (error.code === "P2003") {
            res.status(409).json({
                message: "Operation conflicts with related data",
            });
            return;
        }
    }

    console.error(error);

    res.status(500).json({
        message: "Internal server error",
    });
}
