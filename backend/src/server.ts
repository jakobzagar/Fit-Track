import {app} from "./app.js";
import {env} from "./config/env.js";
import {prisma} from "./db/prisma.js";
import {createShutdownHandler} from "./lifecycle/shutdown.js";
import {logger} from "./observability/logging/logger.js";

const server = app.listen(env.port, () => {
    logger.info({port: env.port}, "server started");
});

const shutdown = createShutdownHandler({
    server,
    disconnect: () => prisma.$disconnect(),
    exit: (code) => process.exit(code),
    logger,
});

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
