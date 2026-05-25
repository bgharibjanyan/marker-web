import {
    createEventTagMap,
    getAuthenticatedEventContext,
    parseEventRequestBody,
    prepareEventDocument,
    serializeEvent,
    saveEventMedia,
    updateEventTagUsage,
} from "@/app/api/event/_shared";
import {ObjectId} from "mongodb";

export async function POST(request) {
    try {
        const auth = await getAuthenticatedEventContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {eventsCollection, tagsCollection, userId} = auth;
        const {body, mediaFiles} = await parseEventRequestBody(request);
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
            userId,
            createdAt: now,
            updatedAt: now,
        };
        const result = await eventsCollection.insertOne(eventDocument);

        await updateEventTagUsage(tagsCollection, [], body.tags);

        const event = await eventsCollection.findOne({_id: result.insertedId});
        const tagMap = await createEventTagMap(tagsCollection, [event]);

        return Response.json({event: serializeEvent(event, tagMap)}, {status: 201});
    } catch (error) {
        console.error("Error in POST /event/create-event:", error);
        return Response.json({error: "Failed to create event"}, {status: 500});
    }
}
