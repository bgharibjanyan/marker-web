import {
    createEventTagMap,
    createEventUserMap,
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

        const subscribedTasks = await tasksCollection
            .find({userId, sourceEventId: eventId})
            .project({_id: 1})
            .toArray();
        const subscribedTaskIds = subscribedTasks.map((task) => task._id);

        if (subscribedTaskIds.length) {
            await tasksCollection.deleteMany({_id: {$in: subscribedTaskIds}});
            await usersCollection.updateOne(
                {_id: userId},
                {$pull: {tasks: {$in: subscribedTaskIds}}}
            );
        }

        await eventsCollection.updateOne(
            {_id: eventId},
            {$pull: {subscribers: userId}}
        );

        const updatedEvent = await eventsCollection.findOne({_id: eventId});
        const tagMap = await createEventTagMap(tagsCollection, [updatedEvent]);
        const userMap = await createEventUserMap(usersCollection, [updatedEvent]);

        return Response.json({
            event: serializeEvent(updatedEvent, tagMap, userMap, userId),
            removedTaskCount: subscribedTaskIds.length,
            message: "Unsubscribed from event",
        }, {status: 200});
    } catch (error) {
        console.error("Error unsubscribing from event:", error);
        return Response.json({error: "Failed to unsubscribe from event"}, {status: 500});
    }
}
