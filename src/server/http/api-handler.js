import {randomUUID} from "crypto";
import {logger} from "@/server/observability/logger";

const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]{8,128}$/;

export const getRequestId = (request) => {
    const supplied = request?.headers?.get("x-request-id") || "";
    return REQUEST_ID_PATTERN.test(supplied) ? supplied : randomUUID();
};

export const apiError = (request, message, {status = 500, code = "internal_error"} = {}) => (
    Response.json({error: message, code, requestId: getRequestId(request)}, {status})
);

export const withApiObservability = (handler, {route, method} = {}) => async (request, context) => {
    const startedAt = performance.now();
    const requestId = getRequestId(request);

    try {
        const response = await handler(request, context);
        response.headers.set("x-request-id", requestId);
        if (!response.headers.has("cache-control")) {
            response.headers.set("cache-control", "no-store");
        }

        const fields = {
            requestId,
            method: method || request.method,
            route,
            status: response.status,
            durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        };
        if (response.status >= 500) logger.error("api.request.completed", fields);
        else if (response.status >= 400) logger.warn("api.request.completed", fields);
        else logger.info("api.request.completed", fields);
        return response;
    } catch (error) {
        logger.error("api.request.failed", {
            error,
            requestId,
            method: method || request.method,
            route,
            durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        });
        const response = apiError(request, "Internal server error", {
            status: 500,
            code: "internal_error",
        });
        response.headers.set("x-request-id", requestId);
        response.headers.set("cache-control", "no-store");
        return response;
    }
};
