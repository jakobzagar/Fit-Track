import {authResponseSchema} from "@fit-track/shared/auth";
import {messageResponseSchema} from "@fit-track/shared/common";
import {apiRequest} from "../../../lib/api/api.client";
import type {AuthResponse, LoginInput, RegisterInput} from "@fit-track/shared/auth";
import type {MessageResponse} from "@fit-track/shared/common";

export function register(data: RegisterInput): Promise<AuthResponse> {
    return apiRequest("/auth/register", authResponseSchema, {
        method: "POST",
        body: data,
        onUnauthorized: "ignore",
    });
}

export function login(data: LoginInput): Promise<AuthResponse> {
    return apiRequest("/auth/login", authResponseSchema, {
        method: "POST",
        body: data,
        onUnauthorized: "ignore",
    });
}

export function logout(): Promise<MessageResponse> {
    return apiRequest("/auth/logout", messageResponseSchema, {
        method: "POST",
    });
}

export function getMe(): Promise<AuthResponse> {
    return apiRequest("/auth/me", authResponseSchema, {onUnauthorized: "ignore"});
}
