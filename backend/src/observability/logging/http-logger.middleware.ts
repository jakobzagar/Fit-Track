import {randomUUID} from "node:crypto";
import type {Request, Response} from "express";
import pino, {type Level, type Logger} from "pino";
import {pinoHttp} from "pino-http";
import {logger} from "./logger.js";

function getRequestLogLevel(request: Request, response: Response, error?: Error): Level {
    if (error || response.statusCode >= 500) return "error";
    if (response.statusCode === 429) return "warn";
    if (request.path.startsWith("/api/health/") && response.statusCode < 400) return "debug";
    return "info";
}

export function createHttpLogger(parentLogger: Logger) {
    return pinoHttp<Request, Response>({
        logger: parentLogger,
        genReqId: (_request, response) => {
            const requestId = randomUUID();
            response.setHeader("X-Request-Id", requestId);
            return requestId;
        },
        quietReqLogger: true,
        customAttributeKeys: {
            reqId: "requestId",
            responseTime: "responseTimeMs",
        },
        wrapSerializers: false,
        serializers: {
            req: (request: Request) => ({
                id: request.id,
                method: request.method,
                path: request.path,
            }),
            res: (response: Response) => ({
                statusCode: response.statusCode,
            }),
            err: pino.stdSerializers.err,
        },
        customLogLevel: getRequestLogLevel,
        customSuccessMessage: () => "request completed",
        customErrorMessage: () => "request failed",
    });
}

export const httpLogger = createHttpLogger(logger);
