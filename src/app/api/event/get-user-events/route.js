import {NextResponse} from "next/server";
import {
    createEventTagMap,
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

        const {eventsCollection, tagsCollection, userId} = auth;
        const {searchParams} = new URL(request.url);
        const requestedUserId = searchParams.get("userId");
        const targetUserId = requestedUserId ? toObjectId(requestedUserId) : userId;

        if (!targetUserId) {
            return NextResponse.json({error: "Invalid userId"}, {status: 400});
        }

        const filter = requestedUserId
            ? {userId: targetUserId, isPrivate: false}
            : {userId: targetUserId};
        const events = await eventsCollection
            .find(filter)
            .sort({createdAt: -1, _id: -1})
            .toArray();
        const tagMap = await createEventTagMap(tagsCollection, events);

        return NextResponse.json({events: events.map((event) => serializeEvent(event, tagMap))}, {status: 200});
    } catch (error) {
        console.error("Error in GET /event/get-user-events:", error);
        return NextResponse.json({error: "Failed to fetch events"}, {status: 500});
    }
}
