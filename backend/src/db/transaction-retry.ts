import {AppError} from "../common/errors/app.error.js";

const MAX_TRANSACTION_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 10;
const RETRYABLE_DATABASE_CODES = new Set(["40001", "40P01"]);

function waitBeforeRetry(attempt: number): Promise<void> {
    const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

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
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
        try {
            return await execute();
        } catch (error) {
            if (!isRetryableTransactionConflict(error)) throw error;

            if (attempt === MAX_TRANSACTION_ATTEMPTS) {
                throw new AppError("Database transaction conflict. Please try again", 503);
            }

            await waitBeforeRetry(attempt);
        }
    }

    throw new AppError("Database transaction conflict. Please try again", 503);
}
