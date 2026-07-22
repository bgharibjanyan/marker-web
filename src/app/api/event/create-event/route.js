import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {    createEventTagMap,
    getAuthenticatedEventContext,
    parseEventRequestBody,
    prepareEventDocument,
    removeEventMedia,
    serializeEvent,
    saveEventMedia,
    updateEventTagUsage,
} from "@/app/api/event/_shared";
import {ObjectId} from "mongodb";
import {UploadValidationError} from "@/server/uploads/image-validation";
import {withMongoTransaction} from "@/server/database/with-mongo-transaction";

async function POSTHandler(request) {
    const eventId = new ObjectId();    let mediaWritten = false;

    try {
        const auth = await getAuthenticatedEventContext(request);
        if (auth.error) return auth.error;

        const parsed = await parseEventRequestBody(request);
        if (parsed.errorResponse) return parsed.errorResponse;
        const {body, mediaFiles} = parsed;
        const {client, eventsCollection, tagsCollection, userId} = auth;

        const transactionResult = await withMongoTransaction(client, async (session) => {
            const prepared = await prepareEventDocument(tagsCollection, body, mediaFiles, session);
            if (prepared.error) return prepared;

            const uploadedMedia = await saveEventMedia(eventId, mediaFiles);
            mediaWritten = uploadedMedia.length > 0;
            const now = new Date();
            const eventDocument = {
                _id: eventId,
                ...prepared.eventData,
                media: uploadedMedia.length ? uploadedMedia : prepared.eventData.media,
                subscribers: [],
                userId,
                createdAt: now,
                updatedAt: now,
            };

            await eventsCollection.insertOne(eventDocument, {session});
            await updateEventTagUsage(tagsCollection, [], body.tags, session);
            return {eventDocument};
        });

        if (transactionResult.error) {
            return Response.json({error: transactionResult.error}, {status: 400});
        }

        const tagMap = await createEventTagMap(tagsCollection, [transactionResult.eventDocument]);
        return Response.json({
            event: serializeEvent(transactionResult.eventDocument, tagMap),
        }, {status: 201});
    } catch (error) {
        if (mediaWritten) await removeEventMedia(eventId).catch(() => {});
        if (error instanceof UploadValidationError) {
            return Response.json({error: error.message}, {status: error.status});
        }
        logger.error("api.handler.error", {message: "Error in POST /event/create-event:", error: error});
        return Response.json({error: "Failed to create event"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/event/create-event", method: "POST"});