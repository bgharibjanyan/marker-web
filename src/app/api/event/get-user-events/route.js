import {NextResponse} from "next/server";
import {
    createEventTagMap,
    createEventUserMap,
    getAuthenticatedEventContext,
    serializeEvent,
    toObjectId,
} from "@/app/api/event/_shared";

export async function GET(request) {
    try {
        const auth = await getAuthenticatedEventContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {eventsCollection, tagsCollection, usersCollection, userId} = auth;
        const {searchParams} = new URL(request.url);
        const requestedUserId = searchParams.get("userId");
        const isFeedRequest = ["1", "true"].includes(String(searchParams.get("feed") || "").toLowerCase());
        const targetUserId = requestedUserId ? toObjectId(requestedUserId) : userId;

        if (!targetUserId) {
            return NextResponse.json({error: "Invalid userId"}, {status: 400});
        }

        const filter = isFeedRequest && !requestedUserId
            ? {$or: [{isPrivate: false}, {isPrivate: {$exists: false}}, {userId: targetUserId}]}
            : requestedUserId
                ? {userId: targetUserId, isPrivate: false}
                : {userId: targetUserId};
        const events = await eventsCollection
            .find(filter)
            .sort({createdAt: -1, _id: -1})
            .toArray();
        const tagMap = await createEventTagMap(tagsCollection, events);
        const userMap = await createEventUserMap(usersCollection, events);

        return NextResponse.json({
            events: events.map((event) => serializeEvent(event, tagMap, userMap, userId)),
            currentUserId: String(userId),
        }, {status: 200});
    } catch (error) {
        console.error("Error in GET /event/get-user-events:", error);
        return NextResponse.json({error: "Failed to fetch events"}, {status: 500});
    }
}
