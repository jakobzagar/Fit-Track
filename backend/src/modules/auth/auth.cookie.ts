import type {CookieOptions, Response} from "express";
import {env} from "../../config/env.js";

const AUTH_COOKIE_NAME = "token";
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createAuthCookieOptions(nodeEnv: "development" | "test" | "production") {
    return {
        httpOnly: true,
        secure: nodeEnv === "production",
        sameSite: "lax",
        path: "/",
    } satisfies CookieOptions;
}

const authCookieOptions = createAuthCookieOptions(env.nodeEnv);

export function setAuthCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE_NAME, token, {
        ...authCookieOptions,
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
    });
}

export function clearAuthCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
}
