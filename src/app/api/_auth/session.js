import clientPromise from "@/app/lib/mongodb";
import {createHash, randomBytes} from "crypto";
import {ObjectId} from "mongodb";
import {enforceRateLimit} from "@/server/security/rate-limiter";
import {rejectOversizedRequest} from "@/server/http/request-validation";

export const SESSION_COOKIE_NAME = "marker_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const hashSessionToken = (token) => (
    createHash("sha256").update(String(token || "")).digest("hex")
);

const unauthorized = () => Response.json({error: "Unauthorized"}, {status: 401});
const forbidden = () => Response.json({error: "Forbidden"}, {status: 403});

const getCookieToken = (request) => {
    const nextCookie = request.cookies?.get?.(SESSION_COOKIE_NAME)?.value;
    if (nextCookie) {
        return nextCookie;
    }

    const cookieHeader = request.headers.get("cookie") || "";
    const cookie = cookieHeader
        .split(";")
        .map((part) => part.trim().split("="))
        .find(([name]) => name === SESSION_COOKIE_NAME);

    return cookie?.[1] ? decodeURIComponent(cookie.slice(1).join("=")) : "";
};

const expectedOrigin = (request) => {
    const configuredOrigin = process.env.APP_ORIGIN?.trim();
    return configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
};

export const validateMutationOrigin = (request) => {
    if (safeMethods.has(request.method.toUpperCase())) {
        return null;
    }

    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
        return forbidden();
    }

    const origin = request.headers.get("origin");
    if (!origin) {
        return process.env.NODE_ENV === "production" ? forbidden() : null;
    }

    try {
        return new URL(origin).origin === expectedOrigin(request) ? null : forbidden();
    } catch {
        return forbidden();
    }
};

export const getAuthCollections = async () => {
    const client = await clientPromise;
    const db = client.db("marker");

    return {
        client,
        db,
        usersCollection: db.collection("user"),
        sessionsCollection: db.collection("session"),    };
};

export const createSession = async (userId) => {
    const {sessionsCollection} = await getAuthCollections();
    const token = randomBytes(32).toString("base64url");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

    await sessionsCollection.insertOne({
        userId: new ObjectId(String(userId)),
        tokenHash: hashSessionToken(token),
        createdAt: now,
        lastSeenAt: now,
        expiresAt,
        revokedAt: null,
    });

    return {token, expiresAt};
};

export const setSessionCookie = (response, token, expiresAt) => {
    response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires: expiresAt,
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
};

export const clearSessionCookie = (response) => {
    response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(0),
        maxAge: 0,
    });
    return response;
};

export const authenticateRequest = async (request, {required = true, role} = {}) => {
    const originError = validateMutationOrigin(request);
    if (originError) {
        return {error: originError};
    }

    const token = getCookieToken(request);
    if (!token) {
        return required ? {error: unauthorized()} : {user: null};
    }

    const {client, db, usersCollection, sessionsCollection} = await getAuthCollections();
    const now = new Date();
    const session = await sessionsCollection.findOne({
        tokenHash: hashSessionToken(token),
        revokedAt: null,
        expiresAt: {$gt: now},
    });

    const userId = session?.userId && ObjectId.isValid(String(session.userId))
        ? new ObjectId(String(session.userId))
        : null;
    if (!userId) {
        return required ? {error: unauthorized()} : {user: null};
    }

    const user = await usersCollection.findOne({_id: userId});
    if (!user || String(user.status || "Active").toLowerCase() !== "active") {
        return required ? {error: unauthorized()} : {user: null};
    }

    if (role && user.role !== role) {
        return {error: forbidden()};
    }

    if (!safeMethods.has(request.method.toUpperCase())) {
        if (!String(request.headers.get("content-type") || "").includes("multipart/form-data")) {
            const sizeError = rejectOversizedRequest(request);
            if (sizeError) {
                return {error: sizeError};
            }
        }

        const rateLimitError = await enforceRateLimit({
            db,
            scope: "authenticated-mutation",            identifier: String(userId),
            limit: 120,
            windowMs: 60 * 1000,
        });
        if (rateLimitError) {
            return {error: rateLimitError};
        }
    }

    const lastSeenAt = session.lastSeenAt ? new Date(session.lastSeenAt) : new Date(0);
    if (now.getTime() - lastSeenAt.getTime() > 15 * 60 * 1000) {
        sessionsCollection.updateOne({_id: session._id}, {$set: {lastSeenAt: now}}).catch(() => {});    }

    return {client, db, user, userId, session, sessionsCollection, usersCollection};
};

export const requireUser = (request) => authenticateRequest(request);export const requireAdmin = (request) => authenticateRequest(request, {role: "admin"});
export const getOptionalUser = (request) => authenticateRequest(request, {required: false});

export const revokeRequestSession = async (request) => {
    const token = getCookieToken(request);
    if (!token) {
        return;
    }
    const {sessionsCollection} = await getAuthCollections();
    await sessionsCollection.updateOne(
        {tokenHash: hashSessionToken(token), revokedAt: null},
        {$set: {revokedAt: new Date()}},
    );
};
