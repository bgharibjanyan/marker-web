import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {withMongoTransaction} from "@/server/database/with-mongo-transaction";import {getAuthenticatedTaskContext} from "@/app/api/task/_auth";
import {ObjectId} from "mongodb";
import {updateTaskTagUsage} from "@/app/api/task/_shared";
async function POSTHandler(request) {
    try {        const auth = await getAuthenticatedTaskContext(request);
        if (auth.error) {
            return auth.error;
        }

        const body = await request.json();
        const taskId = body.taskId || body._id;

        if (!ObjectId.isValid(taskId)) {
            return Response.json({error: 'Invalid task id'}, {status: 400});
        }

        const {client, user, usersCollection, tasksCollection, tagsCollection} = auth;

        const objectId = new ObjectId(taskId);
        const task = await tasksCollection.findOne({_id: objectId, userId: user._id});
        if (!task) {
            return Response.json({error: 'Task not found'}, {status: 404});
        }

        const deleted = await withMongoTransaction(client, async (session) => {
            const result = await tasksCollection.deleteOne(
                {_id: objectId, userId: user._id},
                {session},
            );
            if (result.deletedCount === 0) return false;

            await usersCollection.updateOne(
                {_id: user._id},
                {$pull: {tasks: objectId}},
                {session},
            );
            await updateTaskTagUsage(tagsCollection, task.tags || [], [], session);
            return true;
        });

        if (!deleted) {
            return Response.json({error: 'Task not found'}, {status: 404});
        }

        return Response.json({message: 'Task deleted successfully'}, {status: 200});
    } catch (error) {        logger.error("api.handler.error", {error: error});
        return Response.json({error: 'Failed to delete task'}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/task/delete-task", method: "POST"});