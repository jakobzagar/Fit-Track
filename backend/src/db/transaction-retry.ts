import {AppError} from "../common/errors/app.error.js";

const MAX_TRANSACTION_RETRIES = 3;
const RETRYABLE_DATABASE_CODES = new Set(["40001", "40P01"]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function isRetryableTransactionConflict(error: unknown): boolean {
    if (!isRecord(error)) return false;

    if (error.code === "P2034") return true;
    if (
        (typeof error.originalCode === "string" &&
            RETRYABLE_DATABASE_CODES.has(error.originalCode)) ||
        error.kind === "TransactionWriteConflict"
    ) {
        return true;
    }

    return (
        isRetryableTransactionConflict(error.cause) ||
        isRetryableTransactionConflict(error.meta) ||
        isRetryableTransactionConflict(error.driverAdapterError)
    );
}

export async function runWithTransactionRetry<T>(execute: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
        try {
            return await execute();
        } catch (error) {
            if (!isRetryableTransactionConflict(error)) throw error;

            if (attempt === MAX_TRANSACTION_RETRIES) {
                throw new AppError("Database transaction conflict. Please try again", 503);
            }
        }
    }

    throw new AppError("Database transaction conflict. Please try again", 503);
}
