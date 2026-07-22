import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {createSession, getAuthCollections, setSessionCookie, validateMutationOrigin} from "@/app/api/_auth/session";import {serializeSelfUser} from "@/app/api/profile/_shared";
import {compare} from "bcryptjs";
import {NextResponse} from "next/server";
import {enforceIpRateLimit} from "@/server/security/rate-limiter";
import {normalizeBoundedString, rejectOversizedRequest} from "@/server/http/request-validation";

const DUMMY_PASSWORD_HASH = "$2b$12$Fl7V2NiWqSQZpC.LvCLpnuJhqq7paohV3I9FrUX4rmF.sfUclYl3S";

async function POSTHandler(request) {    const originError = validateMutationOrigin(request);    if (originError) return originError;

    try {
        const sizeError = rejectOversizedRequest(request, 8 * 1024);
        if (sizeError) return sizeError;        const rateLimitError = await enforceIpRateLimit(request, {
            scope: "user-login",
            limit: 10,
            windowMs: 15 * 60 * 1000,
        });
        if (rateLimitError) return rateLimitError;

        const body = await request.json();
        const login = normalizeBoundedString(body.login, {min: 1, max: 254});
        const password = normalizeBoundedString(body.password, {min: 1, max: 1024, trim: false});
        if (!login || !password) {
            return Response.json({error: "Missing required fields"}, {status: 400});
        }

        const credential = String(login).trim();
        const {usersCollection} = await getAuthCollections();
        const user = await usersCollection.findOne(
            {$or: [{login: credential}, {email: credential.toLowerCase()}]},
            {collation: {locale: "en", strength: 2}},
        );
        const passwordMatches = await compare(
            String(password),
            user?.password || DUMMY_PASSWORD_HASH,
        );
        const isActive = String(user?.status || "Active").toLowerCase() === "active";
        if (!passwordMatches || !isActive) {
            return Response.json({error: "Invalid login or password"}, {status: 401});
        }

        const session = await createSession(user._id);
        const response = NextResponse.json({            message: "Login successful",
            user: serializeSelfUser(user),
        });
        return setSessionCookie(response, session.token, session.expiresAt);
    } catch (error) {
        logger.error("api.handler.error", {message: "Error logging in:", error: error});
        return Response.json({error: "Failed to login"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/auth/login", method: "POST"});