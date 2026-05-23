import clientPromise from "@/app/lib/mongodb";
import {ObjectId} from "mongodb";

export const MESSAGE_PAGE_SIZE = 20;

export const toObjectId = (id) => {
    const stringId = String(id || "");
    return ObjectId.isValid(stringId) ? new ObjectId(stringId) : null;
};

export const getAuthenticatedUser = async (request) => {
    const token = request.headers.get("authorization");

    if (!token) {
        return {error: Response.json({error: "Unauthorized"}, {status: 401})};
    }

    const client = await clientPromise;
    const db = client.db("marker");
    const sessionsCollection = db.collection("session");
    const usersCollection = db.collection("user");

    const session = await sessionsCollection.findOne({token});
    const userId = toObjectId(session?.userId);

    if (!userId) {
        return {error: Response.json({error: "Unauthorized"}, {status: 401})};
    }

    const user = await usersCollection.findOne(
        {_id: userId},
        {projection: {password: 0}}
    );

    if (!user) {
        return {error: Response.json({error: "User not found"}, {status: 404})};
    }

    return {db, user, userId};
};

export const getMessageContent = (content) => {
    const normalizedContent = typeof content === "string"
        ? {type: "text", value: content}
        : content;

    if (normalizedContent?.type !== "text") {
        return {error: "Only text messages are supported."};
    }

    const value = String(normalizedContent?.value || "").trim();

    if (!value) {
        return {error: "Message cannot be empty."};
    }

    return {
        content: {
            type: "text",
            value,
        },
    };
};

export const serializeMessage = (message) => ({
    _id: String(message._id),
    sender: String(message.sender),
    reciver: String(message.reciver),
    content: {
        type: message.content?.type || "text",
        value: message.content?.value || "",
    },
    time: message.time instanceof Date ? message.time.toISOString() : message.time,
});
