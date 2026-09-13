import {z} from "zod";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {env} from "../../config/env";
import {ApiError} from "../../common/errors/api.error";
import {notifySessionExpired} from "../auth/session-expiration";

interface ApiOptions {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    onUnauthorized?: "expire-session" | "ignore";
}

async function readResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();

    if (text.trim() === "") return undefined;

    try {
        return JSON.parse(text) as unknown;
    } catch {
        return undefined;
    }
}

export async function apiRequest<T>(
    path: string,
    schema: z.ZodType<T>,
    options: ApiOptions = {},
): Promise<T> {
    const requestInit: RequestInit = {
        method: options.method ?? "GET",
        credentials: "include",
    };
    if (options.body !== undefined) {
        requestInit.headers = {"Content-Type": "application/json"};
        requestInit.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${env.apiBasePath}${path}`, requestInit);

    const result = await readResponseBody(response);

    if (!response.ok) {
        const parsedValidationError = validationErrorResponseSchema.safeParse(result);
        const parsedError = messageResponseSchema.safeParse(result);

        if (response.status === 401 && options.onUnauthorized !== "ignore") {
            notifySessionExpired();
        }

        if (response.status === 400 && parsedValidationError.success) {
            const validation = {
                fieldErrors: parsedValidationError.data.errors,
                ...(parsedValidationError.data.formErrors !== undefined && {
                    formErrors: parsedValidationError.data.formErrors,
                }),
            };
            throw new ApiError(parsedValidationError.data.message, response.status, validation);
        }

        throw new ApiError(
            parsedError.success ? parsedError.data.message : "Request failed",
            response.status,
        );
    }

    const parsedResult = schema.safeParse(result);

    if (!parsedResult.success) {
        console.error("Invalid API response", parsedResult.error);
        throw new ApiError("Invalid server response", response.status);
    }

    return parsedResult.data;
}
