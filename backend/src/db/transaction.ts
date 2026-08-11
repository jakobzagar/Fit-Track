import {Prisma} from "../../generated/prisma/client.js";
import {prisma} from "./prisma.js";
import {runWithTransactionRetry} from "./transaction-retry.js";

export async function runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
    return runWithTransactionRetry(() =>
        prisma.$transaction(operation, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }),
    );
}
