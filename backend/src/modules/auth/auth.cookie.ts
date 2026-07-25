import type {CookieOptions, Response} from "express";
import {env} from "../../config/env.js";

const AUTH_COOKIE_NAME = "token";
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const authCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
};

export function setAuthCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE_NAME, token, {
        ...authCookieOptions,
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
    });
}

export function clearAuthCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);
}
