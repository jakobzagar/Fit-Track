import {z} from "zod";

export const messageResponseSchema = z.object({
    message: z.string(),
});

export const validationErrorResponseSchema = z.object({
    message: z.literal("Validation failed"),
    errors: z.record(z.string(), z.array(z.string())),
});

export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>;
