import pino from "pino";

const redacted = "[REDACTED]";

const urlCredentialsPattern = /\b([a-z][a-z\d+.-]*:\/\/)[^/\s?#@]+@/gi;
const bearerTokenPattern = /\b(Bearer\s+)[A-Za-z\d._~+/=-]+/gi;
const jwtPattern = /\beyJ[A-Za-z\d_-]*\.[A-Za-z\d_-]+\.[A-Za-z\d_-]+\b/g;
const sensitiveValuePattern =
    /\b(password|passwd|pwd|secret|token|access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|client[_-]?secret|account[_-]?key|shared[_-]?access[_-]?(?:key|signature)|sig)\s*=\s*(?:"[^"]*"|'[^']*'|[^;&\s]+)/gi;

export function sanitizeLogText(value: string) {
    return value
        .replace(urlCredentialsPattern, `$1${redacted}@`)
        .replace(bearerTokenPattern, `$1${redacted}`)
        .replace(jwtPattern, redacted)
        .replace(sensitiveValuePattern, (_match, key: string) => `${key}=${redacted}`);
}

export function sanitizeLogValue(value: unknown): unknown {
    if (typeof value === "string") return sanitizeLogText(value);
    if (Array.isArray(value)) return value.map(sanitizeLogValue);
    if (typeof value !== "object" || value === null) return value;

    return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, sanitizeLogValue(nestedValue)]),
    );
}

export function serializeErrorForLog(error: unknown) {
    return sanitizeLogValue(error instanceof Error ? pino.stdSerializers.err(error) : error);
}
