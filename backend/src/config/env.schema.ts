import {z} from "zod";

const databaseUrlSchema = z
    .string()
    .min(1, "DATABASE_URL is required")
    .superRefine((value, ctx) => {
        let url: URL;

        try {
            url = new URL(value);
        } catch {
            ctx.addIssue({
                code: "custom",
                message: "DATABASE_URL must be a valid PostgreSQL URL",
            });
            return;
        }

        if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
            ctx.addIssue({
                code: "custom",
                message: "DATABASE_URL must use the PostgreSQL protocol",
            });
        }

        if (url.hostname === "") {
            ctx.addIssue({
                code: "custom",
                message: "DATABASE_URL must include a host",
            });
        }

        if (url.pathname === "" || url.pathname === "/") {
            ctx.addIssue({
                code: "custom",
                message: "DATABASE_URL must include a database name",
            });
        }

        if (url.hash !== "") {
            ctx.addIssue({
                code: "custom",
                message: "DATABASE_URL must not include a fragment",
            });
        }
    });

const clientOriginSchema = z.url("CLIENT_URL must be a valid URL").transform((value, ctx) => {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        ctx.addIssue({
            code: "custom",
            message: "CLIENT_URL must use HTTP or HTTPS",
        });
        return z.NEVER;
    }

    if (
        url.username !== "" ||
        url.password !== "" ||
        url.pathname !== "/" ||
        url.search !== "" ||
        url.hash !== ""
    ) {
        ctx.addIssue({
            code: "custom",
            message: "CLIENT_URL must contain only an origin",
        });
        return z.NEVER;
    }

    return url.origin;
});

const proxyHopsSchema = z
    .string()
    .regex(/^\d+$/, "TRUST_PROXY_HOPS must be a non-negative integer")
    .transform(Number)
    .pipe(z.number().int().min(0).max(3))
    .default(0);

export const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    PORT: z.coerce.number().int().positive().default(3001),

    DATABASE_URL: databaseUrlSchema,

    JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),

    CLIENT_URL: clientOriginSchema,

    TRUST_PROXY_HOPS: proxyHopsSchema,
});
