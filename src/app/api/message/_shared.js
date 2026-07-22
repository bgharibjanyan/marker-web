import {requireUser} from "@/app/api/_auth/session";
import {ObjectId} from "mongodb";

export const MESSAGE_PAGE_SIZE = 20;

export const toObjectId = (id) => {
    const stringId = String(id || "");
    return ObjectId.isValid(stringId) ? new ObjectId(stringId) : null;
};

export const getAuthenticatedUser = async (request) => {
    const auth = await requireUser(request);
    if (auth.error) {
        return auth;
    }

    return {db: auth.db, user: auth.user, userId: auth.userId};
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

    if (value.length > 4000) {
        return {error: "Message must be 4000 characters or fewer."};
    }

    return {
        content: {
            type: "text",            value,
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
