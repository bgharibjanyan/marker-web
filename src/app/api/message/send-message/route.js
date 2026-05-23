import Message from "@/models/message/Message";
import {
    getAuthenticatedUser,
    getMessageContent,
    serializeMessage,
    toObjectId,
} from "@/app/api/message/_shared";

export async function POST(request) {
    try {
        const auth = await getAuthenticatedUser(request);

        if (auth.error) {
            return auth.error;
        }

        const {db, userId} = auth;
        const usersCollection = db.collection("user");
        const messagesCollection = db.collection("message");
        const body = await request.json();
        const reciverId = toObjectId(body?.reciverId || body?.receiverId || body?.userId);

        if (!reciverId) {
            return Response.json({error: "Missing or invalid reciverId"}, {status: 400});
        }

        if (String(reciverId) === String(userId)) {
            return Response.json({error: "You cannot message yourself"}, {status: 400});
        }

        const reciver = await usersCollection.findOne({_id: reciverId});

        if (!reciver) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        const contentResult = getMessageContent(body?.content);

        if (contentResult.error) {
            return Response.json({error: contentResult.error}, {status: 400});
        }

        const message = new Message({
            sender: userId,
            reciver: reciverId,
            content: contentResult.content,
        });
        const result = await messagesCollection.insertOne(message);

        return Response.json(
            {
                message: serializeMessage({
                    ...message,
                    _id: result.insertedId,
                }),
            },
            {status: 201}
        );
    } catch (error) {
        console.error("Error in POST /message/send-message:", error);
        return Response.json({error: "Failed to send message"}, {status: 500});
    }
}
