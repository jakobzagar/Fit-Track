import {logger} from "../../../observability/logging/logger.js";
import {prisma} from "../../../db/prisma.js";

export async function isDatabaseReady() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        logger.error({err: error}, "database readiness check failed");
        return false;
    }
}
