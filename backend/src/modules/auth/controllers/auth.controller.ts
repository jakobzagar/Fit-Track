import type {Request, Response} from "express";
import {registerService, loginService, getCurrentUserService} from "../services/auth.service.js";
import type {LoginInput, RegisterInput} from "@fit-track/shared/auth";
import {clearAuthCookie, setAuthCookie} from "../cookies/auth.cookie.js";

export async function registerController(_req: Request, res: Response) {
    const body = res.locals.body as RegisterInput;

    const result = await registerService(body);

    setAuthCookie(res, result.token);

    res.status(201).json({
        user: result.user,
    });
}

export async function loginController(_req: Request, res: Response) {
    const body = res.locals.body as LoginInput;

    const result = await loginService(body);

    setAuthCookie(res, result.token);

    res.status(200).json({
        user: result.user,
    });
}

export function logoutController(_req: Request, res: Response) {
    clearAuthCookie(res);

    res.status(200).json({
        message: "Logged out",
    });
}

export async function getCurrentUserController(_req: Request, res: Response) {
    const user = await getCurrentUserService(res.locals.userId);

    res.status(200).json({
        user,
    });
}
