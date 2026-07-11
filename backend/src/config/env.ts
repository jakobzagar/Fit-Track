import "dotenv/config";
import {z, flattenError} from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    PORT: z.coerce.number().int().positive().default(3001),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),

    CLIENT_URL: z.url("CLIENT_URL must be a valid URL"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables");
    console.error(flattenError(parsedEnv.error).fieldErrors);
    process.exit(1);
}

export const env = {
    nodeEnv: parsedEnv.data.NODE_ENV,
    port: parsedEnv.data.PORT,
    databaseUrl: parsedEnv.data.DATABASE_URL,
    jwtSecret: parsedEnv.data.JWT_SECRET,
    clientUrl: parsedEnv.data.CLIENT_URL,
};
