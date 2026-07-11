import type {NextFunction, Request, RequestHandler, Response} from "express";
import {type ZodType, flattenError} from "zod";

type ValidationSource = "body" | "params" | "query";

export function validate(schema: ZodType, source: ValidationSource = "body"): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: flattenError(result.error).fieldErrors,
            });
            return;
        }

        res.locals[source] = result.data;

        next();
    };
}
