import {authResponseSchema} from "@fit-track/shared/auth";
import {messageResponseSchema} from "@fit-track/shared/common";
import {apiRequest} from "../../../lib/api/api.client.ts";
import type {AuthResponse, MessageResponse} from "../types/auth.types.ts";
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
