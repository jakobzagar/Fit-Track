import type {NextFunction, Request, Response} from "express";
import {AppError} from "../errors/app.error.js";

export function apiNotFound(_req: Request, _res: Response, next: NextFunction) {
    next(new AppError("Resource not found", 404));
}
