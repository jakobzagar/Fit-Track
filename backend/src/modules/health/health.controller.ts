import type {Request, Response} from "express";
import {isDatabaseReady} from "./health.service.js";

export function getLiveness(_req: Request, res: Response) {
    res.status(200).json({status: "ok"});
}

export async function getReadiness(_req: Request, res: Response) {
    if (!(await isDatabaseReady())) {
        res.status(503).json({status: "not_ready"});
        return;
    }

    res.status(200).json({status: "ready"});
}
