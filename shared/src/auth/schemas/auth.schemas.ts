import {z} from "zod";

const textEncoder = new TextEncoder();

const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email is too long")
    .pipe(z.email("Invalid email address"));

function bcryptCompatiblePassword(schema: z.ZodString) {
    return schema.refine((password) => textEncoder.encode(password).length <= 72, {
        message: "Password must be at most 72 UTF-8 bytes",
    });
}

export const registerSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
        email: emailSchema,
        password: bcryptCompatiblePassword(
            z.string().min(8, "Password must be at least 8 characters"),
        ),
    })
    .strict();

export const loginSchema = z
    .object({
        email: emailSchema,
        password: bcryptCompatiblePassword(z.string().min(1, "Password is required")),
    })
    .strict();

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
