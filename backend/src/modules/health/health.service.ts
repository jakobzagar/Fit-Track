import {prisma} from "../../db/prisma.js";

export async function isDatabaseReady() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
}
