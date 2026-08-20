import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../../generated/prisma/client.js";
import {env} from "../config/env.js";

const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
    max: env.databasePoolMax,
    connectionTimeoutMillis: env.databaseConnectionTimeoutMs,
    idleTimeoutMillis: env.databaseIdleTimeoutMs,
    keepAlive: true,
    application_name: "fit-track-backend",
});

export const prisma = new PrismaClient({adapter});
