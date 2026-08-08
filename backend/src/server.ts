import {app} from "./app.js";
import {env} from "./config/env.js";
import {prisma} from "./db/prisma.js";

const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
});

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}, shutting down`);

    const forceShutdown = setTimeout(() => {
        console.error("Graceful shutdown timed out");
        server.closeAllConnections();
        process.exit(1);
    }, 10_000);

    try {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
        await prisma.$disconnect();
        clearTimeout(forceShutdown);
        console.log("Graceful shutdown complete");
        process.exit(0);
    } catch (error) {
        clearTimeout(forceShutdown);
        console.error("Graceful shutdown failed", error);
        process.exit(1);
    }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
