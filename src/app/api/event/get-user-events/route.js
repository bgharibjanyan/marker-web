import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {NextResponse} from "next/server";import {
    createEventTagMap,
    createEventUserMap,
    getAuthenticatedEventContext,
    serializeEvent,
    toObjectId,
} from "@/app/api/event/_shared";

async function GETHandler(request) {
    try {        const auth = await getAuthenticatedEventContext(request);
        if (auth.error) return auth.error;

        const {eventsCollection, tagsCollection, usersCollection, userId} = auth;
        const {searchParams} = new URL(request.url);
        const requestedUserId = searchParams.get("userId");
        const isFeedRequest = ["1", "true"].includes(String(searchParams.get("feed") || "").toLowerCase());
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
        const cursorValue = searchParams.get("cursor");
        const cursor = cursorValue ? toObjectId(cursorValue) : null;
        if (cursorValue && !cursor) {
            return NextResponse.json({error: "Invalid cursor"}, {status: 400});
        }
        const targetUserId = requestedUserId ? toObjectId(requestedUserId) : userId;
        if (!targetUserId) {
            return NextResponse.json({error: "Invalid userId"}, {status: 400});
        }

        const visibilityFilter = isFeedRequest && !requestedUserId
            ? {$or: [{isPrivate: false}, {isPrivate: {$exists: false}}, {userId: targetUserId}]}
            : requestedUserId
                ? {userId: targetUserId, $or: [{isPrivate: false}, {isPrivate: {$exists: false}}]}
                : {userId: targetUserId};
        const filter = cursor ? {$and: [visibilityFilter, {_id: {$lt: cursor}}]} : visibilityFilter;
        const results = await eventsCollection
            .find(filter)
            .sort({_id: -1})
            .limit(limit + 1)
            .toArray();
        const hasMore = results.length > limit;
        const events = results.slice(0, limit);
        const tagMap = await createEventTagMap(tagsCollection, events);
        const userMap = await createEventUserMap(usersCollection, events);
        return NextResponse.json({
            events: events.map((event) => serializeEvent(event, tagMap, userMap, userId)),
            currentUserId: String(userId),
            hasMore,
            nextCursor: hasMore ? String(events.at(-1)?._id || "") : null,
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in GET /event/get-user-events:", error: error});
        return NextResponse.json({error: "Failed to fetch events"}, {status: 500});    }
}

export const GET = withApiObservability(GETHandler, {route: "/api/event/get-user-events", method: "GET"});