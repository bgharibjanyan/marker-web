const LOG_LEVELS = {debug: 10, info: 20, warn: 30, error: 40};

const configuredLevel = String(process.env.LOG_LEVEL || "info").toLowerCase();
const minimumLevel = LOG_LEVELS[configuredLevel] || LOG_LEVELS.info;

const serializeError = (error) => {
    if (!(error instanceof Error)) return error;

    return {
        name: error.name,
        message: error.message,
        ...(process.env.NODE_ENV !== "production" && error.stack ? {stack: error.stack} : {}),
    };
};

const normalizeFields = (fields = {}) => Object.fromEntries(
    Object.entries(fields)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, key === "error" ? serializeError(value) : value]),
);

const write = (level, event, fields) => {
    if (LOG_LEVELS[level] < minimumLevel) return;

    const record = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        service: process.env.SERVICE_NAME || "marker-web",
        environment: process.env.NODE_ENV || "development",
        ...normalizeFields(fields),
    });

    if (level === "error") console.error(record);
    else if (level === "warn") console.warn(record);
    else console.log(record);
};

export const logger = {
    debug: (event, fields) => write("debug", event, fields),
    info: (event, fields) => write("info", event, fields),
    warn: (event, fields) => write("warn", event, fields),
    error: (event, fields) => write("error", event, fields),
};
