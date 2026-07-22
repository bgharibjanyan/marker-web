import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {enforceRateLimit} from "@/server/security/rate-limiter";import {requireUser} from "@/app/api/_auth/session";
import {serializePublicUser, serializeSelfUser} from "@/app/api/profile/_shared";
import {NextResponse} from "next/server";
import {ObjectId} from "mongodb";


async function POSTHandler(request) {
    try {        const auth = await requireUser(request);
        if (auth.error) return auth.error;

        const endpointRateLimit = await enforceRateLimit({
            db: auth.db,
            scope: "user-follow",
            identifier: String(auth.userId),
            limit: 30,
            windowMs: 60000,
        });
        if (endpointRateLimit) return endpointRateLimit;

        const followedUserId = String((await request.json())?.userId || "").trim();
        if (!ObjectId.isValid(followedUserId)) {            return NextResponse.json({error: "Missing or invalid userId"}, {status: 400});
        }
        if (String(auth.userId) === followedUserId) {
            return NextResponse.json({error: "You cannot follow yourself"}, {status: 400});
        }

        const followedObjectId = new ObjectId(followedUserId);
        const followedUser = await auth.usersCollection.findOne({
            _id: followedObjectId,
            publicProfile: {$ne: false},
        });
        if (!followedUser) return NextResponse.json({error: "User not found"}, {status: 404});

        await auth.usersCollection.updateOne({_id: auth.userId}, {$addToSet: {connections: followedObjectId}});
        const user = await auth.usersCollection.findOne({_id: auth.userId});
        return NextResponse.json({
            user: serializeSelfUser(user),
            followedUser: serializePublicUser(followedUser),
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in POST /user/follow-user:", error: error});
        return NextResponse.json({error: "Failed to follow user"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/user/follow-user", method: "POST"});