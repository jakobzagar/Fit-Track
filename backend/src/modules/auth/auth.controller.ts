import type {Request, Response} from "express";
import {env} from "../../config/env.js";
import {registerService, loginService, getMeService} from "./auth.service.js";
import type {LoginInput, RegisterInput} from "./auth.schema.js";

export async function registerController(_req: Request, res: Response) {
    const body = res.locals.body as RegisterInput;

    const result = await registerService(body);

    res.cookie("token", result.token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
        user: result.user,
    });
}

export async function logInController(_req: Request, res: Response) {
    const body = res.locals.body as LoginInput;

    const result = await loginService(body);

    res.cookie("token", result.token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        user: result.user,
    });
}

export async function logOutController(_req: Request, res: Response) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
    });

    res.status(200).json({
        message: "Logged out",
    });
}

export async function getMeController(_req: Request, res: Response) {
    const user = await getMeService(res.locals.userId);

    res.status(200).json({
        user,
    });
}
