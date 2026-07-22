import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {requireAdmin} from "@/app/api/admin/_shared";import {
    createEventTagMap,
    deleteEventWithSubscriptions,
    EVENT_PAGE_SIZE,
    getEventCollections,
    getEventTaskFields,
    parseEventRequestBody,
    prepareEventDocument,
    removeEventMedia,
    removeSavedEventMedia,
    serializeEvent,
    saveEventMedia,
    toObjectId,
    updateEventTagUsage,
} from "@/app/api/event/_shared";
import {ObjectId} from "mongodb";
import {UploadValidationError} from "@/server/uploads/image-validation";
import {withMongoTransaction} from "@/server/database/with-mongo-transaction";

async function GETHandler(request) {
    try {        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const {searchParams} = new URL(request.url);
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || EVENT_PAGE_SIZE, 1), 50);
        const skip = Math.min(Math.max(Number(searchParams.get("skip")) || 0, 0), 10000);
        const search = String(searchParams.get("search") || "").trim().slice(0, 160);
        const filter = search ? {$text: {$search: search}} : {};

        const {eventsCollection, tagsCollection} = await getEventCollections();
        const total = await eventsCollection.countDocuments(filter);
        const events = await eventsCollection
            .find(filter)
            .sort(search ? {score: {$meta: "textScore"}} : {createdAt: -1, _id: -1})
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
        logger.error("api.handler.error", {message: "Error loading admin events:", error: error});
        return Response.json({error: "Failed to load events"}, {status: 500});    }
}

async function POSTHandler(request) {
    const eventId = new ObjectId();    let uploadedMedia = [];

    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const parsed = await parseEventRequestBody(request);
        if (parsed.errorResponse) return parsed.errorResponse;
        const {body, mediaFiles} = parsed;
        const {client, eventsCollection, tagsCollection} = await getEventCollections();

        const transactionResult = await withMongoTransaction(client, async (session) => {
            const prepared = await prepareEventDocument(tagsCollection, body, mediaFiles, session);
            if (prepared.error) return prepared;

            uploadedMedia = await saveEventMedia(eventId, mediaFiles);
            const now = new Date();
            const eventDocument = {
                _id: eventId,
                ...prepared.eventData,
                media: uploadedMedia.length ? uploadedMedia : prepared.eventData.media,
                subscribers: [],
                createdAt: now,
                updatedAt: now,
            };
            await eventsCollection.insertOne(eventDocument, {session});
            await updateEventTagUsage(tagsCollection, [], body.tags, session);
            return {eventDocument};
        });

        if (transactionResult.error) {
            await removeEventMedia(eventId).catch(() => {});
            return Response.json({error: transactionResult.error}, {status: 400});
        }

        const tagMap = await createEventTagMap(tagsCollection, [transactionResult.eventDocument]);
        return Response.json({
            event: serializeEvent(transactionResult.eventDocument, tagMap),
        }, {status: 201});
    } catch (error) {
        if (uploadedMedia.length) await removeEventMedia(eventId).catch(() => {});
        if (error instanceof UploadValidationError) {
            return Response.json({error: error.message}, {status: error.status});
        }
        logger.error("api.handler.error", {message: "Error creating admin event:", error: error});
        return Response.json({error: "Failed to create event"}, {status: 500});    }
}

async function PATCHHandler(request) {
    let uploadedMedia = [];
    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const parsed = await parseEventRequestBody(request);
        if (parsed.errorResponse) return parsed.errorResponse;
        const {body, mediaFiles} = parsed;
        const eventId = toObjectId(body.id || body._id || body.eventId);
        if (!eventId) {
            return Response.json({error: "Invalid event id"}, {status: 400});
        }

        const {client, eventsCollection, tagsCollection, tasksCollection} = await getEventCollections();
        const transactionResult = await withMongoTransaction(client, async (session) => {
            const existingEvent = await eventsCollection.findOne({_id: eventId}, {session});
            if (!existingEvent) return {notFound: true};

            const prepared = await prepareEventDocument(tagsCollection, body, mediaFiles, session);
            if (prepared.error) return prepared;

            uploadedMedia = await saveEventMedia(eventId, mediaFiles);
            const updatedAt = new Date();
            const eventUpdate = {
                ...prepared.eventData,
                media: uploadedMedia.length
                    ? [...prepared.eventData.media, ...uploadedMedia]
                    : prepared.eventData.media,
                subscribers: existingEvent.subscribers || [],
                userId: existingEvent.userId || null,
                updatedAt,
            };

            const result = await eventsCollection.findOneAndUpdate(
                {_id: eventId},
                {$set: eventUpdate},
                {returnDocument: "after", session},
            );
            const updatedEvent = result?.value || result;
            if (!updatedEvent) return {notFound: true};

            await updateEventTagUsage(tagsCollection, existingEvent.tags || [], body.tags, session);
            await tasksCollection.updateMany(
                {sourceEventId: eventId},
                {$set: {...getEventTaskFields(updatedEvent), updatedAt}},
                {session},
            );
            return {updatedEvent};
        });

        if (transactionResult.notFound) {
            await removeSavedEventMedia(uploadedMedia);
            return Response.json({error: "Event not found"}, {status: 404});
        }
        if (transactionResult.error) {
            await removeSavedEventMedia(uploadedMedia);
            return Response.json({error: transactionResult.error}, {status: 400});
        }

        const tagMap = await createEventTagMap(tagsCollection, [transactionResult.updatedEvent]);
        return Response.json({
            event: serializeEvent(transactionResult.updatedEvent, tagMap),
        }, {status: 200});
    } catch (error) {
        await removeSavedEventMedia(uploadedMedia).catch(() => {});
        if (error instanceof UploadValidationError) {
            return Response.json({error: error.message}, {status: error.status});
        }
        logger.error("api.handler.error", {message: "Error updating admin event:", error: error});
        return Response.json({error: "Failed to update event"}, {status: 500});    }
}

async function DELETEHandler(request) {
    try {        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const {searchParams} = new URL(request.url);
        const body = request.headers.get("content-type")?.includes("application/json")
            ? await request.json()
            : {};
        const eventId = body.id || body._id || body.eventId || searchParams.get("id");
        const collections = await getEventCollections();
        const result = await deleteEventWithSubscriptions({...collections, eventId});

        if (result.error) return result.error;

        return Response.json({
            message: "Event deleted successfully",
            deletedTaskCount: result.deletedTaskCount,
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error deleting admin event:", error: error});
        return Response.json({error: "Failed to delete event"}, {status: 500});    }
}

export const GET = withApiObservability(GETHandler, {route: "/api/admin/events", method: "GET"});
export const POST = withApiObservability(POSTHandler, {route: "/api/admin/events", method: "POST"});
export const PATCH = withApiObservability(PATCHHandler, {route: "/api/admin/events", method: "PATCH"});
export const DELETE = withApiObservability(DELETEHandler, {route: "/api/admin/events", method: "DELETE"});