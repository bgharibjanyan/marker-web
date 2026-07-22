import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {    getAuthenticatedUser,
    MESSAGE_PAGE_SIZE,
    serializeMessage,
    toObjectId,
} from "@/app/api/message/_shared";

async function POSTHandler(request) {
    try {        const auth = await getAuthenticatedUser(request);

        if (auth.error) {
            return auth.error;
        }

        const {db, userId} = auth;
        const messagesCollection = db.collection("message");
        const body = await request.json();
        const reciverId = toObjectId(body?.reciverId || body?.receiverId || body?.userId);

        if (!reciverId) {
            return Response.json({error: "Missing or invalid userId"}, {status: 400});
        }

        const limit = Math.min(
            Math.max(Number(body?.limit) || MESSAGE_PAGE_SIZE, 1),
            MESSAGE_PAGE_SIZE
        );
        const before = body?.before ? new Date(body.before) : null;

        const query = {
            $or: [
                {sender: userId, reciver: reciverId},
                {sender: reciverId, reciver: userId},
            ],
        };

        if (before && !Number.isNaN(before.getTime())) {
            query.time = {$lt: before};
        }

        const results = await messagesCollection
            .find(query)
            .sort({time: -1, _id: -1})
            .limit(limit + 1)
            .toArray();

        const hasMore = results.length > limit;
        const messages = results.slice(0, limit).reverse().map(serializeMessage);

        return Response.json(
            {
                messages,
                hasMore,
                nextBefore: messages[0]?.time || null,
            },
            {status: 200}
        );
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in POST /message/get-messages:", error: error});
        return Response.json({error: "Failed to fetch messages"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/message/get-messages", method: "POST"});