const LOG_LEVELS = new Set(["debug", "info", "warn", "error"]);

export const getRuntimeConfigurationProblems = () => {
    const problems = [];

    if (!process.env.MONGODB_URI) {
        problems.push("MONGODB_URI is required");
    }

    const logLevel = String(process.env.LOG_LEVEL || "info").toLowerCase();
    if (!LOG_LEVELS.has(logLevel)) {
        problems.push("LOG_LEVEL must be debug, info, warn, or error");
    }

    if (process.env.NODE_ENV === "production") {
        if (process.env.TRUST_PROXY_HEADERS !== "true") {
            problems.push("TRUST_PROXY_HEADERS must be true behind the production reverse proxy");
        }

        try {
            const origin = new URL(process.env.APP_ORIGIN || "");            if (origin.protocol !== "https:") {
                problems.push("APP_ORIGIN must use HTTPS in production");
            }
        } catch {
            problems.push("APP_ORIGIN must be a valid absolute URL in production");
        }
    }

    return problems;
};

export const getHealthcheckTimeoutMs = () => {
    const configured = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 2000);
    return Number.isFinite(configured)
        ? Math.min(Math.max(Math.round(configured), 250), 10000)
        : 2000;
};
