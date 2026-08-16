import {z} from "zod";
export {
    messageResponseSchema,
    type MessageResponse,
} from "../../common/schemas/response.schemas.js";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Invalid email address"));

export const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
    email: emailSchema,
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").max(72, "Password is too long"),
});

export const userSchema = z
    .object({
        id: z.uuid(),
        name: z.string(),
        email: z.email(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
    })
    .strict();

export const authResponseSchema = z
    .object({
        user: userSchema,
    })
    .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
