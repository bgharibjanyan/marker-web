import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {requireUser} from "@/app/api/_auth/session";import {serializeSelfUser} from "@/app/api/profile/_shared";

async function GETHandler(request) {
    try {        const auth = await requireUser(request);
        if (auth.error) {
            return auth.error;
        }

        return Response.json({
            authenticated: true,
            user: serializeSelfUser(auth.user),
        });
    } catch (error) {
        logger.error("api.handler.error", {message: "Error checking authentication:", error: error});
        return Response.json({error: "Failed to check authentication"}, {status: 500});    }
}

export const GET = withApiObservability(GETHandler, {route: "/api/auth/check", method: "GET"});