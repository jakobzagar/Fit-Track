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
    const response = await fetch(`${env.apiUrl}${path}`, {
        method: options.method ?? "GET",
        credentials: "include",
        headers: options.body === undefined ? undefined : {"Content-Type": "application/json"},
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const result = await readResponseBody(response);

    if (!response.ok) {
        const parsedValidationError = validationErrorResponseSchema.safeParse(result);
        const parsedError = messageResponseSchema.safeParse(result);

        if (response.status === 401 && options.onUnauthorized !== "ignore") {
            notifySessionExpired();
        }

        if (response.status === 400 && parsedValidationError.success) {
            throw new ApiError(parsedValidationError.data.message, response.status, {
                fieldErrors: parsedValidationError.data.errors,
                formErrors: parsedValidationError.data.formErrors,
            });
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
