import pino, {type DestinationStream, type Level, type LoggerOptions} from "pino";
import {env} from "../../config/env.js";

interface LoggerConfig {
    environment: "development" | "test" | "production";
    level: Level;
}

const loggerOptions: Pick<LoggerOptions, "redact" | "serializers"> = {
    redact: {
        paths: [
            "authorization",
            "cookie",
            "databaseUrl",
            "DATABASE_URL",
            "jwtSecret",
            "JWT_SECRET",
            "password",
            "token",
            "*.authorization",
            "*.cookie",
            "*.databaseUrl",
            "*.DATABASE_URL",
            "*.jwtSecret",
            "*.JWT_SECRET",
            "*.password",
            "*.token",
            "req.headers.authorization",
            "req.headers.cookie",
            'res.headers["set-cookie"]',
        ],
        censor: "[REDACTED]",
    },
    serializers: {
        err: pino.stdSerializers.err,
    },
};

export function createLogger(config: LoggerConfig, destination?: DestinationStream) {
    const options: LoggerOptions = {
        ...loggerOptions,
        level: config.environment === "test" ? "silent" : config.level,
        base: {
            service: "fit-track-backend",
            environment: config.environment,
        },
    };

    if (destination) {
        return pino(options, destination);
    }

    if (config.environment === "development") {
        return pino({
            ...options,
            transport: {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: "SYS:standard",
                },
            },
        });
    }

    return pino(options);
}

export const logger = createLogger({
    environment: env.nodeEnv,
    level: env.logLevel,
});
