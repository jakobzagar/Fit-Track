import {z} from "zod";

export const messageResponseSchema = z
    .object({
        message: z.string(),
    })
    .strict();

export const validationErrorResponseSchema = z
    .object({
        message: z.literal("Validation failed"),
        errors: z.record(z.string(), z.array(z.string())),
        formErrors: z.array(z.string()).optional(),
    })
    .strict();

export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>;
