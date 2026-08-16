import {z} from "zod";

export const livenessResponseSchema = z
    .object({
        status: z.literal("ok"),
    })
    .strict();

export const readinessResponseSchema = z
    .object({
        status: z.enum(["ready", "not_ready"]),
    })
    .strict();

export type LivenessResponse = z.infer<typeof livenessResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
