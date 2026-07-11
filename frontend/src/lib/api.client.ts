import {z} from "zod";
import {env} from "../config/env.ts";

interface ApiOptions {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
}

const errorResponseSchema = z.object({
    message: z.string(),
});

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

    const result: unknown = await response.json();

    if (!response.ok) {
        const parsedError = errorResponseSchema.safeParse(result);

        throw new Error(parsedError.success ? parsedError.data.message : "Request failed");
    }

    const parsedResult = schema.safeParse(result);

    if (!parsedResult.success) {
        console.error("Invalid API response", parsedResult.error);
        throw new Error("Invalid server response");
    }

    return parsedResult.data;
}
