import type {Logger} from "pino";

interface ClosableServer {
    close(callback: (error?: Error) => void): void;
    closeAllConnections(): void;
}

interface ShutdownDependencies {
    server: ClosableServer;
    disconnect: () => Promise<void>;
    exit: (code: number) => void;
    logger: Pick<Logger, "info" | "error">;
    timeoutMs?: number;
}

export function createShutdownHandler({
    server,
    disconnect,
    exit,
    logger,
    timeoutMs = 10_000,
}: ShutdownDependencies) {
    let isShuttingDown = false;

    return async function shutdown(signal: NodeJS.Signals) {
        if (isShuttingDown) return;

        isShuttingDown = true;
        logger.info({signal}, "graceful shutdown started");

        const forceShutdown = setTimeout(() => {
            logger.error({signal, timeoutMs}, "graceful shutdown timed out");
            server.closeAllConnections();
            exit(1);
        }, timeoutMs);

        try {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => (error ? reject(error) : resolve()));
            });
            await disconnect();
            clearTimeout(forceShutdown);
            logger.info({signal}, "graceful shutdown complete");
            exit(0);
        } catch (error) {
            clearTimeout(forceShutdown);
            logger.error({err: error, signal}, "graceful shutdown failed");
            exit(1);
        }
    };
}
