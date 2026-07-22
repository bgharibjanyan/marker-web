import clientPromise from "@/app/lib/mongodb";
import {createHash} from "crypto";

const RATE_LIMIT_COLLECTION = "rate_limits";

const hashIdentifier = (value) => (
    createHash("sha256").update(String(value || "unknown")).digest("hex")
);

export const getClientIp = (request) => {
    const trustProxyHeaders = process.env.TRUST_PROXY_HEADERS === "true";
    if (!trustProxyHeaders) {
        return "untrusted-proxy";
    }

    const forwardedChain = String(request.headers.get("x-forwarded-for") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    const trustedHops = Math.min(
        Math.max(Number(process.env.TRUSTED_PROXY_HOPS || 0), 0),
        Math.max(forwardedChain.length - 1, 0),
    );
    const forwardedIndex = forwardedChain.length - 1 - trustedHops;

    return forwardedChain[forwardedIndex]
        || String(request.headers.get("x-real-ip") || "unknown").trim();
};
export const consumeRateLimit = async ({
    scope,
    identifier,
    limit,
    windowMs,
    db: suppliedDb,
}) => {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetAt = new Date(windowStart + windowMs);
    const key = hashIdentifier(`${scope}:${identifier}:${windowStart}`);
    const db = suppliedDb || (await clientPromise).db("marker");
    const entry = await db.collection(RATE_LIMIT_COLLECTION).findOneAndUpdate(
        {_id: key},
        {
            $inc: {count: 1},
            $setOnInsert: {
                scope,
                windowStart: new Date(windowStart),
                expiresAt: new Date(resetAt.getTime() + windowMs),
            },
        },
        {upsert: true, returnDocument: "after"},
    );
    const count = Number(entry?.count || 1);

    return {
        allowed: count <= limit,
        limit,
        remaining: Math.max(limit - count, 0),
        resetAt,
        retryAfterSeconds: Math.max(Math.ceil((resetAt.getTime() - now) / 1000), 1),
    };
};

export const rateLimitResponse = (result) => Response.json(
    {error: "Too many requests. Please try again later."},
    {
        status: 429,
        headers: {
            "Retry-After": String(result.retryAfterSeconds),
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
        },
    },
);

export const enforceRateLimit = async (options) => {
    const result = await consumeRateLimit(options);
    return result.allowed ? null : rateLimitResponse(result);
};

export const enforceIpRateLimit = (request, options) => enforceRateLimit({
    ...options,
    identifier: getClientIp(request),
});
