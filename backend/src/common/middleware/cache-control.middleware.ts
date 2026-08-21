import type {RequestHandler} from "express";

export const preventApiResponseCaching: RequestHandler = (_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
};
