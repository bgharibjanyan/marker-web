import {
    createEventTagMap,
    createEventUserMap,
    createSubscribedTask,
    getAuthenticatedEventContext,
    serializeEvent,
    toObjectId,
} from "@/app/api/event/_shared";

export async function POST(request) {
    try {
        const auth = await getAuthenticatedEventContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {eventsCollection, tasksCollection, usersCollection, tagsCollection, userId} = auth;
        const body = await request.json();
        const eventId = toObjectId(body.eventId || body.id || body._id);

        if (!eventId) {
            return Response.json({error: "Invalid event id"}, {status: 400});
        }

        const event = await eventsCollection.findOne({_id: eventId});

        if (!event) {
            return Response.json({error: "Event not found"}, {status: 404});
        }

        let task = await tasksCollection.findOne({userId, sourceEventId: eventId});

        if (!task) {
            const taskDocument = createSubscribedTask(event, userId);
            const result = await tasksCollection.insertOne(taskDocument);
            task = {_id: result.insertedId, ...taskDocument};

            await usersCollection.updateOne(
                {_id: userId},
                {$addToSet: {tasks: result.insertedId}}
            );
        }

        await eventsCollection.updateOne(
            {_id: eventId},
            {$addToSet: {subscribers: userId}}
        );

        const updatedEvent = await eventsCollection.findOne({_id: eventId});
        const tagMap = await createEventTagMap(tagsCollection, [updatedEvent]);
        const userMap = await createEventUserMap(usersCollection, [updatedEvent]);

        return Response.json({
            event: serializeEvent(updatedEvent, tagMap, userMap, userId),
            taskId: String(task._id),
            message: "Subscribed to event",
        }, {status: 200});
    } catch (error) {
        console.error("Error subscribing to event:", error);
        return Response.json({error: "Failed to subscribe to event"}, {status: 500});
    }
}
