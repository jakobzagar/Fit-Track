import type {NextFunction, Request, Response} from "express";
import {Prisma} from "../../../generated/prisma/client.js";
import {logger} from "../../observability/logging/logger.js";
import {AppError} from "../errors/app.error.js";

function isRequestBodyError(error: unknown): error is {type: string} {
    return (
        typeof error === "object" &&
        error !== null &&
        "type" in error &&
        (error.type === "entity.too.large" || error.type === "entity.parse.failed")
    );
}

export function errorMiddleware(error: unknown, req: Request, res: Response, _next: NextFunction) {
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

    if (isRequestBodyError(error)) {
        const isTooLarge = error.type === "entity.too.large";
        res.status(isTooLarge ? 413 : 400).json({
            message: isTooLarge ? "Request payload too large" : "Invalid JSON payload",
        });
        return;
    }

    const requestLogger = req.log ?? logger;
    requestLogger.error({err: error}, "unhandled request error");

    res.status(500).json({
        message: "Internal server error",
    });
}
