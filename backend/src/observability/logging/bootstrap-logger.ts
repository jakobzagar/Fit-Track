import pino from "pino";

export const bootstrapLogger = pino({
    level: "error",
    base: {
        service: "fit-track-backend",
    },
    serializers: {
        err: pino.stdSerializers.err,
    },
});
