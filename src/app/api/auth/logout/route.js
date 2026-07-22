import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {clearSessionCookie, revokeRequestSession, validateMutationOrigin} from "@/app/api/_auth/session";import {NextResponse} from "next/server";

async function POSTHandler(request) {
    const originError = validateMutationOrigin(request);    if (originError) {
        return originError;
    }

    try {
        await revokeRequestSession(request);
        return clearSessionCookie(NextResponse.json({message: "Logged out"}));
    } catch (error) {
        logger.error("api.handler.error", {message: "Error logging out:", error: error});
        return Response.json({error: "Failed to logout"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/auth/logout", method: "POST"});