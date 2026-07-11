import {authResponseSchema, messageResponseSchema} from "@fit-track/shared/auth";
import {apiRequest} from "../../../lib/api.client.ts";
import type {AuthResponse, MessageResponse} from "../auth.types.ts";
import type {LoginInput, RegisterInput} from "../schemas/auth.schemas.ts";

export function register(data: RegisterInput): Promise<AuthResponse> {
    return apiRequest("/auth/register", authResponseSchema, {
        method: "POST",
        body: data,
    });
}

export function login(data: LoginInput): Promise<AuthResponse> {
    return apiRequest("/auth/login", authResponseSchema, {
        method: "POST",
        body: data,
    });
}

export function logout(): Promise<MessageResponse> {
    return apiRequest("/auth/logout", messageResponseSchema, {
        method: "POST",
    });
}

export function getMe(): Promise<AuthResponse> {
    return apiRequest("/auth/me", authResponseSchema);
}
