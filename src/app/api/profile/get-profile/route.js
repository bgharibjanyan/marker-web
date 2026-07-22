import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {    getCurrentUser,
    getProfileCollections,
    serializePublicUser,
    serializeSelfUser,
    toObjectId,
} from "@/app/api/profile/_shared";

async function GETHandler(request) {
    try {        const {searchParams} = new URL(request.url);
        const requestedUserId = searchParams.get("userId");
        const current = await getCurrentUser(request, false);
        if (current.error) {
            return current.error;
        }

        const currentUser = current.user || null;
        const targetUserId = requestedUserId
            ? toObjectId(requestedUserId)
            : toObjectId(currentUser?._id);
        if (!targetUserId) {
            return Response.json({error: "Invalid userId"}, {status: 400});
        }

        const {usersCollection} = await getProfileCollections();
        const profileUser = await usersCollection.findOne({_id: targetUserId});
        if (!profileUser) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        const currentUserId = currentUser?._id ? String(currentUser._id) : "";
        const profileUserId = String(profileUser._id);
        const isOwner = currentUserId === profileUserId;
        if (!isOwner && profileUser.publicProfile === false) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        const currentConnections = (currentUser?.connections || []).map((id) => String(id));
        return Response.json({
            user: isOwner ? serializeSelfUser(profileUser) : serializePublicUser(profileUser),
            currentUser: currentUser ? serializeSelfUser(currentUser) : null,
            isOwner,
            isFollowing: currentConnections.includes(profileUserId),
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in GET /profile/get-profile:", error: error});
        return Response.json({error: "Failed to load profile"}, {status: 500});    }
}

export const GET = withApiObservability(GETHandler, {route: "/api/profile/get-profile", method: "GET"});