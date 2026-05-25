import {isAdminRequest} from "@/app/api/admin/_shared";
import {
    createEventTagMap,
    deleteEventWithSubscriptions,
    EVENT_PAGE_SIZE,
    getEventCollections,
    getEventTaskFields,
    parseEventRequestBody,
    prepareEventDocument,
    serializeEvent,
    saveEventMedia,
    toObjectId,
    updateEventTagUsage,
} from "@/app/api/event/_shared";
import {ObjectId} from "mongodb";

export async function GET(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const {searchParams} = new URL(request.url);
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || EVENT_PAGE_SIZE, 1), 50);
        const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);
        const search = String(searchParams.get("search") || "").trim();
        const filter = search
            ? {
                $or: [
                    {title: {$regex: search, $options: "i"}},
                    {description: {$regex: search, $options: "i"}},
                    {location: {$regex: search, $options: "i"}},
                ],
            }
            : {};

        const {eventsCollection, tagsCollection} = await getEventCollections();
        const total = await eventsCollection.countDocuments(filter);
        const events = await eventsCollection
            .find(filter)
            .sort({createdAt: -1, _id: -1})
            .skip(skip)
            .limit(limit)
            .toArray();
        const tagMap = await createEventTagMap(tagsCollection, events);

        return Response.json({
            events: events.map((event) => serializeEvent(event, tagMap)),
            total,
            nextSkip: skip + events.length,
            hasMore: skip + events.length < total,
        }, {status: 200});
    } catch (error) {
        console.error("Error loading admin events:", error);
        return Response.json({error: "Failed to load events"}, {status: 500});
    }
}

export async function POST(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const {body, mediaFiles} = await parseEventRequestBody(request);
        const {eventsCollection, tagsCollection} = await getEventCollections();
        const prepared = await prepareEventDocument(tagsCollection, body, mediaFiles);

        if (prepared.error) {
            return Response.json({error: prepared.error}, {status: 400});
        }

        const now = new Date();
        const eventId = new ObjectId();
        const uploadedMedia = await saveEventMedia(eventId, mediaFiles);
        const eventDocument = {
            _id: eventId,
            ...prepared.eventData,
            media: uploadedMedia.length ? uploadedMedia : prepared.eventData.media,
            subscribers: [],
            createdAt: now,
            updatedAt: now,
        };
        const result = await eventsCollection.insertOne(eventDocument);

        await updateEventTagUsage(tagsCollection, [], body.tags);

        const event = await eventsCollection.findOne({_id: result.insertedId});
        const tagMap = await createEventTagMap(tagsCollection, [event]);

        return Response.json({event: serializeEvent(event, tagMap)}, {status: 201});
    } catch (error) {
        console.error("Error creating admin event:", error);
        return Response.json({error: "Failed to create event"}, {status: 500});
    }
}

export async function PATCH(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const {body, mediaFiles} = await parseEventRequestBody(request);
        const eventId = toObjectId(body.id || body._id || body.eventId);

        if (!eventId) {
            return Response.json({error: "Invalid event id"}, {status: 400});
        }

        const {eventsCollection, tagsCollection, tasksCollection} = await getEventCollections();
        const existingEvent = await eventsCollection.findOne({_id: eventId});

        if (!existingEvent) {
            return Response.json({error: "Event not found"}, {status: 404});
        }

        const prepared = await prepareEventDocument(tagsCollection, body, mediaFiles);

        if (prepared.error) {
            return Response.json({error: prepared.error}, {status: 400});
        }

        const updatedAt = new Date();
        const uploadedMedia = await saveEventMedia(eventId, mediaFiles);
        const eventUpdate = {
            ...prepared.eventData,
            media: uploadedMedia.length ? [...prepared.eventData.media, ...uploadedMedia] : prepared.eventData.media,
            subscribers: existingEvent.subscribers || [],
            userId: existingEvent.userId || null,
            updatedAt,
        };

        const result = await eventsCollection.findOneAndUpdate(
            {_id: eventId},
            {$set: eventUpdate},
            {returnDocument: "after"}
        );
        const updatedEvent = result?.value || result;

        if (!updatedEvent) {
            return Response.json({error: "Event not found"}, {status: 404});
        }

        await updateEventTagUsage(tagsCollection, existingEvent.tags || [], body.tags);
        await tasksCollection.updateMany(
            {sourceEventId: eventId},
            {$set: {...getEventTaskFields(updatedEvent), updatedAt}}
        );

        const tagMap = await createEventTagMap(tagsCollection, [updatedEvent]);

        return Response.json({event: serializeEvent(updatedEvent, tagMap)}, {status: 200});
    } catch (error) {
        console.error("Error updating admin event:", error);
        return Response.json({error: "Failed to update event"}, {status: 500});
    }
}

export async function DELETE(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const {searchParams} = new URL(request.url);
        const body = request.headers.get("content-type")?.includes("application/json")
            ? await request.json()
            : {};
        const eventId = body.id || body._id || body.eventId || searchParams.get("id");
        const collections = await getEventCollections();
        const result = await deleteEventWithSubscriptions({...collections, eventId});

        if (result.error) {
            return result.error;
        }

        return Response.json({
            message: "Event deleted successfully",
            deletedTaskCount: result.deletedTaskCount,
        }, {status: 200});
    } catch (error) {
        console.error("Error deleting admin event:", error);
        return Response.json({error: "Failed to delete event"}, {status: 500});
    }
}
