import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {enforceRateLimit} from "@/server/security/rate-limiter";import {withMongoTransaction} from "@/server/database/with-mongo-transaction";
import {
    createEventTagMap,
    createEventUserMap,    createSubscribedTask,    getAuthenticatedEventContext,
    serializeEvent,
    toObjectId,
} from "@/app/api/event/_shared";


async function POSTHandler(request) {
    try {        const auth = await getAuthenticatedEventContext(request);
        if (auth.error) {
            return auth.error;
        }
        const endpointRateLimit = await enforceRateLimit({
            db: auth.db,
            scope: "event-subscribe",
            identifier: String(auth.userId),
            limit: 60,
            windowMs: 60000,
        });
        if (endpointRateLimit) return endpointRateLimit;

        const {client, eventsCollection, tasksCollection, usersCollection, tagsCollection, userId} = auth;
        const body = await request.json();
        const eventId = toObjectId(body.eventId || body.id || body._id);
        if (!eventId) {
            return Response.json({error: "Invalid event id"}, {status: 400});        }

        const event = await eventsCollection.findOne({_id: eventId});

        if (!event) {
            return Response.json({error: "Event not found"}, {status: 404});
        }

        if (event.isPrivate && String(event.userId) !== String(userId)) {
            return Response.json({error: "Event not found"}, {status: 404});
        }
        const task = await withMongoTransaction(client, async (session) => {
            let subscribedTask = await tasksCollection.findOne(
                {userId, sourceEventId: eventId},
                {session},
            );

            if (!subscribedTask) {
                const taskDocument = createSubscribedTask(event, userId);
                const result = await tasksCollection.insertOne(taskDocument, {session});
                subscribedTask = {_id: result.insertedId, ...taskDocument};
                await usersCollection.updateOne(
                    {_id: userId},
                    {$addToSet: {tasks: result.insertedId}},
                    {session},
                );
            }

            const subscriptionResult = await eventsCollection.updateOne(
                {_id: eventId, "subscribers.999": {$exists: false}},
                {$addToSet: {subscribers: userId}},
                {session},
            );
            if (subscriptionResult.matchedCount === 0) {
                throw Object.assign(new Error("Event subscriber limit reached"), {
                    code: "EVENT_SUBSCRIBER_LIMIT",
                });
            }
            return subscribedTask;
        });
        const updatedEvent = await eventsCollection.findOne({_id: eventId});
        const tagMap = await createEventTagMap(tagsCollection, [updatedEvent]);
        const userMap = await createEventUserMap(usersCollection, [updatedEvent]);

        return Response.json({
            event: serializeEvent(updatedEvent, tagMap, userMap, userId),            taskId: String(task._id),
            message: "Subscribed to event",
        }, {status: 200});
    } catch (error) {
        if (error?.code === "EVENT_SUBSCRIBER_LIMIT") {
            return Response.json({error: "Event subscriber limit reached"}, {status: 409});
        }
        logger.error("api.handler.error", {message: "Error subscribing to event:", error: error});
        return Response.json({error: "Failed to subscribe to event"}, {status: 500});    }}

export const POST = withApiObservability(POSTHandler, {route: "/api/event/subscribe-event", method: "POST"});