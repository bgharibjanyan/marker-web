import {isAdminRequest} from "@/app/api/admin/_shared";
import {deleteEventWithSubscriptions, getEventCollections} from "@/app/api/event/_shared";

export async function POST(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const body = await request.json();
        const collections = await getEventCollections();
        const result = await deleteEventWithSubscriptions({
            ...collections,
            eventId: body.eventId || body.id || body._id,
        });

        if (result.error) {
            return result.error;
        }

        return Response.json({
            message: "Event deleted successfully",
            deletedTaskCount: result.deletedTaskCount,
        }, {status: 200});
    } catch (error) {
        console.error("Error in POST /event/delete-event:", error);
        return Response.json({error: "Failed to delete event"}, {status: 500});
    }
}
