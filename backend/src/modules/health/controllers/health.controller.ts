import type {Request, Response} from "express";
import {isDatabaseReady} from "../services/health.service.js";

export function getLivenessController(_req: Request, res: Response) {
    res.status(200).json({status: "ok"});
}

export async function getReadinessController(_req: Request, res: Response) {
    if (!(await isDatabaseReady())) {
        res.status(503).json({status: "not_ready"});
        return;
    }

    res.status(200).json({status: "ready"});
}
