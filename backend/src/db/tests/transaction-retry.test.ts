import {describe, expect, it, vi} from "vitest";
import {isRetryableTransactionConflict, runWithTransactionRetry} from "../transaction-retry.js";

describe("transaction retry handling", () => {
    it.each([
        ["Prisma P2034", {code: "P2034"}],
        ["Prisma 7 write conflict", {cause: {kind: "TransactionWriteConflict"}}],
        ["PostgreSQL serialization failure", {cause: {originalCode: "40001"}}],
        ["PostgreSQL deadlock", {meta: {driverAdapterError: {cause: {originalCode: "40P01"}}}}],
    ])("recognizes %s as retryable", (_case, error) => {
        expect(isRetryableTransactionConflict(error)).toBe(true);
    });

    it("does not retry unrelated failures", async () => {
        const error = new Error("connection refused");
        const execute = vi.fn().mockRejectedValue(error);

        await expect(runWithTransactionRetry(execute)).rejects.toBe(error);
        expect(execute).toHaveBeenCalledOnce();
    });

    it("returns the result after a retryable conflict", async () => {
        const execute = vi
            .fn<() => Promise<string>>()
            .mockRejectedValueOnce({cause: {originalCode: "40001"}})
            .mockResolvedValueOnce("committed");

        await expect(runWithTransactionRetry(execute)).resolves.toBe("committed");
        expect(execute).toHaveBeenCalledTimes(2);
    });

    it("returns a stable 503 error after exhausting all retries", async () => {
        const execute = vi.fn().mockRejectedValue({cause: {originalCode: "40P01"}});

        await expect(runWithTransactionRetry(execute)).rejects.toEqual(
            expect.objectContaining({
                message: "Database transaction conflict. Please try again",
                statusCode: 503,
            }),
        );
        expect(execute).toHaveBeenCalledTimes(3);
    });
});
