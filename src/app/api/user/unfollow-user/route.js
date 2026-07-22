import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {requireUser} from "@/app/api/_auth/session";import {serializeSelfUser} from "@/app/api/profile/_shared";
import {NextResponse} from "next/server";
import {ObjectId} from "mongodb";

async function POSTHandler(request) {
    try {        const auth = await requireUser(request);
        if (auth.error) return auth.error;

        const unfollowedUserId = String((await request.json())?.userId || "").trim();
        if (!ObjectId.isValid(unfollowedUserId)) {
            return NextResponse.json({error: "Missing or invalid userId"}, {status: 400});
        }

        await auth.usersCollection.updateOne(
            {_id: auth.userId},
            {$pull: {connections: new ObjectId(unfollowedUserId)}},
        );
        const user = await auth.usersCollection.findOne({_id: auth.userId});
        return NextResponse.json({user: serializeSelfUser(user)}, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in POST /user/unfollow-user:", error: error});
        return NextResponse.json({error: "Failed to unfollow user"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/user/unfollow-user", method: "POST"});