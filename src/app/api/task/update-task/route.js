import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {withMongoTransaction} from "@/server/database/with-mongo-transaction";import {getAuthenticatedTaskContext} from "@/app/api/task/_auth";
import TaskModel from "@/models/event/TaskModel";
import {ObjectId} from "mongodb";
import {resolveTaskTagIds, updateTaskTagUsage, validateTaskInput} from "@/app/api/task/_shared";
import {sanitizeRichText} from "@/app/lib/richText";


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

        const validationError = validateTaskInput(body);

        if (validationError) {
            return Response.json({error: validationError}, {status: 400});
        }

        const {client, user, tasksCollection, tagsCollection} = auth;

        const objectId = new ObjectId(taskId);
        const existingTask = await tasksCollection.findOne({_id: objectId, userId: user._id});
        if (!existingTask) {
            return Response.json({error: 'Task not found'}, {status: 404});
        }

        const updated = await withMongoTransaction(client, async (session) => {
            const tagIds = await resolveTaskTagIds(tagsCollection, body.tags, session);
            const taskData = new TaskModel({
                ...body,
                description: sanitizeRichText(body.description) || null,
                tags: tagIds,
            });
            taskData.setUser(user._id);

            const result = await tasksCollection.updateOne(
                {_id: objectId, userId: user._id},
                {$set: taskData},
                {session},
            );
            if (result.matchedCount === 0) return false;
            await updateTaskTagUsage(tagsCollection, existingTask.tags || [], body.tags, session);
            return true;
        });

        if (!updated) {
            return Response.json({error: 'Task not found'}, {status: 404});
        }

        return Response.json({message: 'Task updated successfully'}, {status: 200});
    } catch (error) {        logger.error("api.handler.error", {error: error});
        return Response.json({error: 'Failed to update task'}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/task/update-task", method: "POST"});