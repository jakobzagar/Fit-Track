import {Prisma} from "../../generated/prisma/client.js";
import {AppError} from "../common/errors/app.error.js";
import {prisma} from "./prisma.js";

const MAX_TRANSACTION_RETRIES = 3;

export async function runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
        try {
            return await prisma.$transaction(operation, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        } catch (error) {
            const isRetryableConflict =
                error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

            if (!isRetryableConflict) {
                throw error;
            }

            if (attempt === MAX_TRANSACTION_RETRIES) {
                throw new AppError("Database transaction conflict. Please try again", 503);
            }
        }
    }

    throw new AppError("Database transaction conflict. Please try again", 503);
}
