import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {clearSessionCookie, requireUser} from "@/app/api/_auth/session";import {NextResponse} from "next/server";

async function POSTHandler(request) {
    try {        const auth = await requireUser(request);
        if (auth.error) {
            return auth.error;
        }

        await auth.sessionsCollection.updateMany(
            {userId: auth.userId, revokedAt: null},
            {$set: {revokedAt: new Date()}},
        );

        return clearSessionCookie(NextResponse.json({message: "All sessions revoked"}));
    } catch (error) {
        logger.error("api.handler.error", {message: "Error revoking sessions:", error: error});
        return Response.json({error: "Failed to revoke sessions"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/auth/revoke-sessions", method: "POST"});