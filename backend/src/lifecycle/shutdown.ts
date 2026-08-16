interface ClosableServer {
    close(callback: (error?: Error) => void): void;
    closeAllConnections(): void;
}

interface ShutdownDependencies {
    server: ClosableServer;
    disconnect: () => Promise<void>;
    exit: (code: number) => void;
    log: (message: string) => void;
    logError: (message: string, error?: unknown) => void;
    timeoutMs?: number;
}

export function createShutdownHandler({
    server,
    disconnect,
    exit,
    log,
    logError,
    timeoutMs = 10_000,
}: ShutdownDependencies) {
    let isShuttingDown = false;

    return async function shutdown(signal: NodeJS.Signals) {
        if (isShuttingDown) return;

        isShuttingDown = true;
        log(`Received ${signal}, shutting down`);

        const forceShutdown = setTimeout(() => {
            logError("Graceful shutdown timed out");
            server.closeAllConnections();
            exit(1);
        }, timeoutMs);

        try {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
            });
            await disconnect();
            clearTimeout(forceShutdown);
            log("Graceful shutdown complete");
            exit(0);
        } catch (error) {
            clearTimeout(forceShutdown);
            logError("Graceful shutdown failed", error);
            exit(1);
        }
    };
}
