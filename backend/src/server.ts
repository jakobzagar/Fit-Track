import {app} from "./app.js";
import {env} from "./config/env.js";
import {prisma} from "./db/prisma.js";
import {createShutdownHandler} from "./lifecycle/shutdown.js";

const server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
});

const shutdown = createShutdownHandler({
    server,
    disconnect: () => prisma.$disconnect(),
    exit: (code) => process.exit(code),
    log: (message) => console.log(message),
    logError: (message, error) => console.error(message, error),
});

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
