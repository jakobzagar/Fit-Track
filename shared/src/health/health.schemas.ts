import {z} from "zod";

export const livenessResponseSchema = z.object({
    status: z.literal("ok"),
});

export const readinessResponseSchema = z.object({
    status: z.enum(["ready", "not_ready"]),
});

export type LivenessResponse = z.infer<typeof livenessResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
