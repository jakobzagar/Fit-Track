import {afterEach, describe, expect, it, vi} from "vitest";
import {createShutdownHandler} from "./shutdown.js";

afterEach(() => {
    vi.useRealTimers();
});

function createDependencies() {
    const server = {
        close: vi.fn<(callback: (error?: Error) => void) => void>((callback) => callback()),
        closeAllConnections: vi.fn(),
    };
    const disconnect = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const exit = vi.fn<(code: number) => void>();
    const log = vi.fn();
    const logError = vi.fn();

    return {server, disconnect, exit, log, logError};
}

describe("graceful shutdown", () => {
    it("stops accepting connections, disconnects Prisma, and exits successfully once", async () => {
        const dependencies = createDependencies();
        const shutdown = createShutdownHandler(dependencies);

        await Promise.all([shutdown("SIGTERM"), shutdown("SIGINT")]);

        expect(dependencies.server.close).toHaveBeenCalledOnce();
        expect(dependencies.disconnect).toHaveBeenCalledOnce();
        expect(dependencies.exit).toHaveBeenCalledOnce();
        expect(dependencies.exit).toHaveBeenCalledWith(0);
        expect(dependencies.server.closeAllConnections).not.toHaveBeenCalled();
    });

    it("exits with failure when closing the HTTP server fails", async () => {
        const dependencies = createDependencies();
        const error = new Error("close failed");
        dependencies.server.close.mockImplementationOnce((callback) => callback(error));
        const shutdown = createShutdownHandler(dependencies);

        await shutdown("SIGTERM");

        expect(dependencies.disconnect).not.toHaveBeenCalled();
        expect(dependencies.logError).toHaveBeenCalledWith("Graceful shutdown failed", error);
        expect(dependencies.exit).toHaveBeenCalledWith(1);
    });

    it("exits with failure when Prisma disconnect fails", async () => {
        const dependencies = createDependencies();
        const error = new Error("disconnect failed");
        dependencies.disconnect.mockRejectedValueOnce(error);
        const shutdown = createShutdownHandler(dependencies);

        await shutdown("SIGTERM");

        expect(dependencies.server.close).toHaveBeenCalledOnce();
        expect(dependencies.logError).toHaveBeenCalledWith("Graceful shutdown failed", error);
        expect(dependencies.exit).toHaveBeenCalledWith(1);
    });

    it("force-closes connections and exits with failure after the timeout", async () => {
        vi.useFakeTimers();
        const dependencies = createDependencies();
        dependencies.server.close.mockImplementationOnce(() => undefined);
        const shutdown = createShutdownHandler({...dependencies, timeoutMs: 10_000});

        void shutdown("SIGTERM");
        await vi.advanceTimersByTimeAsync(10_000);

        expect(dependencies.server.closeAllConnections).toHaveBeenCalledOnce();
        expect(dependencies.disconnect).not.toHaveBeenCalled();
        expect(dependencies.logError).toHaveBeenCalledWith("Graceful shutdown timed out");
        expect(dependencies.exit).toHaveBeenCalledWith(1);
    });

    it("times out while Prisma disconnect is pending", async () => {
        vi.useFakeTimers();
        const dependencies = createDependencies();
        dependencies.disconnect.mockImplementationOnce(() => new Promise(() => undefined));
        const shutdown = createShutdownHandler({...dependencies, timeoutMs: 10_000});

        void shutdown("SIGTERM");
        await vi.advanceTimersByTimeAsync(10_000);

        expect(dependencies.server.close).toHaveBeenCalledOnce();
        expect(dependencies.disconnect).toHaveBeenCalledOnce();
        expect(dependencies.server.closeAllConnections).toHaveBeenCalledOnce();
        expect(dependencies.exit).toHaveBeenCalledTimes(1);
        expect(dependencies.exit).toHaveBeenCalledWith(1);
    });
});
