import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {withMongoTransaction} from "@/server/database/with-mongo-transaction";import {getAuthenticatedTaskContext} from "@/app/api/task/_auth";
import TaskModel from "@/models/event/TaskModel";
import {resolveTaskTagIds, updateTaskTagUsage, validateTaskInput} from "@/app/api/task/_shared";
import {sanitizeRichText} from "@/app/lib/richText";


async function POSTHandler(request) {
    try {        const auth = await getAuthenticatedTaskContext(request);
        if (auth.error) {
            return auth.error;
        }

        const {client, user, usersCollection, tasksCollection, tagsCollection} = auth;

        const body = await request.json();
        const validationError = validateTaskInput(body);
        if (validationError) {
            return Response.json({error: validationError}, {status: 400});
        }

        const result = await withMongoTransaction(client, async (session) => {
            const tagIds = await resolveTaskTagIds(tagsCollection, body.tags, session);
            const taskData = new TaskModel({
                ...body,
                description: sanitizeRichText(body.description) || null,
                tags: tagIds,
            });
            taskData.setUser(user._id);

            const insertResult = await tasksCollection.insertOne(taskData, {session});
            await updateTaskTagUsage(tagsCollection, [], body.tags, session);
            await usersCollection.updateOne(
                {_id: user._id},
                {$addToSet: {tasks: insertResult.insertedId}},
                {session},
            );
            return insertResult;
        });

        return Response.json({
            message: 'Task added successfully',            taskId: result.insertedId.toString(),
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {error: error});
        return Response.json({error: 'Failed to create task'}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/task/add-task", method: "POST"});