import pino from "pino";
import {serializeErrorForLog} from "./utils/sanitize-log-value.js";

export const bootstrapLogger = pino({
    level: "error",
    base: {
        service: "fit-track-backend",
    },
    serializers: {
        err: serializeErrorForLog,
    },
});
