import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {requireUser} from "@/app/api/_auth/session";import {serializeSelfUser} from "@/app/api/profile/_shared";
import {NextResponse} from "next/server";

async function GETHandler(request) {
    try {        const auth = await requireUser(request);
        if (auth.error) return auth.error;
        return NextResponse.json({user: serializeSelfUser(auth.user)}, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in GET /user/get-user:", error: error});
        return NextResponse.json({error: "Failed to fetch user"}, {status: 500});    }
}

export const GET = withApiObservability(GETHandler, {route: "/api/user/get-user", method: "GET"});