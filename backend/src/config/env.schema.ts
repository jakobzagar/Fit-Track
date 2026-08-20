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

const databaseTlsModeSchema = z.enum(["require", "allow-insecure"]).optional();

const databasePoolMaxSchema = z.coerce.number().int().min(1).max(50).default(5);

const databaseConnectionTimeoutSchema = z.coerce.number().int().min(100).max(60_000).default(5_000);

const databaseIdleTimeoutSchema = z.coerce.number().int().min(1_000).max(300_000).default(30_000);

const logLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info");

const secureDatabaseSslModes = new Set(["require", "verify-ca", "verify-full"]);

function getDatabaseSslMode(databaseUrl: string) {
    try {
        return new URL(databaseUrl).searchParams.get("sslmode");
    } catch {
        return null;
    }
}

export const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

        PORT: z.coerce.number().int().positive().default(3001),

        DATABASE_URL: databaseUrlSchema,
        DATABASE_TLS_MODE: databaseTlsModeSchema,
        DB_POOL_MAX: databasePoolMaxSchema,
        DB_CONNECTION_TIMEOUT_MS: databaseConnectionTimeoutSchema,
        DB_IDLE_TIMEOUT_MS: databaseIdleTimeoutSchema,

        LOG_LEVEL: logLevelSchema,

        JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),

        CLIENT_URL: clientOriginSchema,

        TRUST_PROXY_HOPS: proxyHopsSchema,
    })
    .superRefine((value, ctx) => {
        const requiresTls =
            value.DATABASE_TLS_MODE === "require" ||
            (value.NODE_ENV === "production" && value.DATABASE_TLS_MODE !== "allow-insecure");

        if (
            requiresTls &&
            !secureDatabaseSslModes.has(getDatabaseSslMode(value.DATABASE_URL) ?? "")
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["DATABASE_URL"],
                message:
                    "DATABASE_URL must require TLS in production with sslmode=require, verify-ca, or verify-full",
            });
        }
    });
