import "dotenv/config";
import {flattenError} from "zod";
import {envSchema} from "./env.schema.js";

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
    databasePoolMax: parsedEnv.data.DB_POOL_MAX,
    databaseConnectionTimeoutMs: parsedEnv.data.DB_CONNECTION_TIMEOUT_MS,
    databaseIdleTimeoutMs: parsedEnv.data.DB_IDLE_TIMEOUT_MS,
    jwtSecret: parsedEnv.data.JWT_SECRET,
    clientOrigin: parsedEnv.data.CLIENT_URL,
    trustProxyHops: parsedEnv.data.TRUST_PROXY_HOPS,
};
