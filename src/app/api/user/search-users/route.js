import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {enforceRateLimit} from "@/server/security/rate-limiter";import {requireUser} from "@/app/api/_auth/session";
import {serializePublicUser} from "@/app/api/profile/_shared";
import {NextResponse} from "next/server";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


async function POSTHandler(request) {
    try {        const auth = await requireUser(request);
        if (auth.error) return auth.error;

        const endpointRateLimit = await enforceRateLimit({
            db: auth.db,
            scope: "user-search",
            identifier: String(auth.userId),
            limit: 60,
            windowMs: 60000,
        });
        if (endpointRateLimit) return endpointRateLimit;

        const query = String((await request.json())?.query || "").trim().slice(0, 80);
        if (!query) return NextResponse.json({users: []}, {status: 200});
        const users = await auth.usersCollection.find(
            {
                _id: {$ne: auth.userId},
                publicProfile: {$ne: false},
                $text: {$search: query},
            },
            {projection: {score: {$meta: "textScore"}}},
        ).sort({score: {$meta: "textScore"}}).limit(25).toArray();

        return NextResponse.json({users: users.map(serializePublicUser)}, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in POST /user/search-users:", error: error});
        return NextResponse.json({error: "Failed to search users"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/user/search-users", method: "POST"});