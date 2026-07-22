import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {requireAdmin} from "@/app/api/admin/_shared";import {deleteEventWithSubscriptions, getEventCollections} from "@/app/api/event/_shared";

async function POSTHandler(request) {
    try {        const auth = await requireAdmin(request);
        if (auth.error) {
            return auth.error;
        }

        const body = await request.json();
        const collections = await getEventCollections();
        const result = await deleteEventWithSubscriptions({
            ...collections,
            eventId: body.eventId || body.id || body._id,        });

        if (result.error) {
            return result.error;
        }

        return Response.json({
            message: "Event deleted successfully",
            deletedTaskCount: result.deletedTaskCount,
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in POST /event/delete-event:", error: error});
        return Response.json({error: "Failed to delete event"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/event/delete-event", method: "POST"});