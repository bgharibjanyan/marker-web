import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {    getAuthenticatedUser,
    getMessageContent,
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
        const messageId = toObjectId(body?.messageId);

        if (!messageId) {
            return Response.json({error: "Missing or invalid messageId"}, {status: 400});
        }

        const contentResult = getMessageContent(body?.content);

        if (contentResult.error) {
            return Response.json({error: contentResult.error}, {status: 400});
        }

        const result = await messagesCollection.findOneAndUpdate(
            {_id: messageId, sender: userId},
            {$set: {content: contentResult.content}},
            {returnDocument: "after"}
        );
        const updatedMessage = result?.value || result;

        if (!updatedMessage) {
            return Response.json({error: "Message not found"}, {status: 404});
        }

        return Response.json({message: serializeMessage(updatedMessage)}, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in POST /message/edit-message:", error: error});
        return Response.json({error: "Failed to edit message"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/message/edit-message", method: "POST"});