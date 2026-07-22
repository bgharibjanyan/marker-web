import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {requireUser} from "@/app/api/_auth/session";import {serializePublicUser} from "@/app/api/profile/_shared";
import {NextResponse} from "next/server";
import {ObjectId} from "mongodb";

async function POSTHandler(request) {
    try {        const auth = await requireUser(request);
        if (auth.error) return auth.error;

        const {ids} = await request.json();
        if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50) {
            return NextResponse.json({error: "Provide between 1 and 50 user IDs"}, {status: 400});
        }

        const allowedIds = new Set((auth.user.connections || []).map(String));
        const requestedIds = [...new Set(ids.map(String))];
        if (requestedIds.some((id) => !ObjectId.isValid(id) || !allowedIds.has(id))) {
            return NextResponse.json({error: "Forbidden user collection request"}, {status: 403});
        }

        const users = await auth.usersCollection.find({
            _id: {$in: requestedIds.map((id) => new ObjectId(id))},
            publicProfile: {$ne: false},
        }).toArray();

        return NextResponse.json({users: users.map(serializePublicUser)}, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in POST /user/get-user-collection:", error: error});
        return NextResponse.json({error: "Failed to fetch users"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/user/get-user-collection", method: "POST"});