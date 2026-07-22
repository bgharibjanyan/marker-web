import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {withMongoTransaction} from "@/server/database/with-mongo-transaction";import {
    createEventTagMap,
    createEventUserMap,    getAuthenticatedEventContext,
    serializeEvent,
    toObjectId,
} from "@/app/api/event/_shared";

async function POSTHandler(request) {
    try {        const auth = await getAuthenticatedEventContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {client, eventsCollection, tasksCollection, usersCollection, tagsCollection, userId} = auth;
        const body = await request.json();
        const eventId = toObjectId(body.eventId || body.id || body._id);
        if (!eventId) {
            return Response.json({error: "Invalid event id"}, {status: 400});
        }

        const event = await eventsCollection.findOne({_id: eventId});

        if (!event) {
            return Response.json({error: "Event not found"}, {status: 404});
        }

        const removedTaskCount = await withMongoTransaction(client, async (session) => {
            const subscribedTask = await tasksCollection.findOne(
                {userId, sourceEventId: eventId},
                {session, projection: {_id: 1}},
            );

            if (subscribedTask) {
                await tasksCollection.deleteOne({_id: subscribedTask._id}, {session});
                await usersCollection.updateOne(
                    {_id: userId},
                    {$pull: {tasks: subscribedTask._id}},
                    {session},
                );
            }

            await eventsCollection.updateOne(
                {_id: eventId},
                {$pull: {subscribers: userId}},
                {session},
            );
            return subscribedTask ? 1 : 0;
        });

        const updatedEvent = await eventsCollection.findOne({_id: eventId});
        const tagMap = await createEventTagMap(tagsCollection, [updatedEvent]);
        const userMap = await createEventUserMap(usersCollection, [updatedEvent]);

        return Response.json({
            event: serializeEvent(updatedEvent, tagMap, userMap, userId),            removedTaskCount,
            message: "Unsubscribed from event",
        }, {status: 200});
    } catch (error) {        logger.error("api.handler.error", {message: "Error unsubscribing from event:", error: error});
        return Response.json({error: "Failed to unsubscribe from event"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/event/unsubscribe-event", method: "POST"});