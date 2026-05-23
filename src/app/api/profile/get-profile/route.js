import {
    getCurrentUser,
    getProfileCollections,
    serializeProfileUser,
    toObjectId,
} from "@/app/api/profile/_shared";

export async function GET(request) {
    try {
        const {searchParams} = new URL(request.url);
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
        const profileUser = await usersCollection.findOne(
            {_id: targetUserId},
            {projection: {password: 0}}
        );

        if (!profileUser) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        const currentUserId = currentUser?._id ? String(currentUser._id) : "";
        const profileUserId = String(profileUser._id);
        const currentConnections = (currentUser?.connections || []).map((id) => String(id));

        return Response.json({
            user: serializeProfileUser(profileUser),
            currentUser: currentUser ? serializeProfileUser(currentUser) : null,
            isOwner: currentUserId === profileUserId,
            isFollowing: currentConnections.includes(profileUserId),
        }, {status: 200});
    } catch (error) {
        console.error("Error in GET /profile/get-profile:", error);
        return Response.json({error: "Failed to load profile"}, {status: 500});
    }
}
