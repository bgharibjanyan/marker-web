import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {getAuthenticatedTaskContext} from "@/app/api/task/_auth";import {ObjectId} from "mongodb";
import {createTaskTagMap, serializeTaskTags} from "@/app/api/task/_shared";

const serializeTask = (task, viewerUserId, tagMap) => {
    const serializedTask = {
        ...task,
        _id: task._id?.toString(),
        userId: task.userId?.toString(),
        tagIds: (task.tags || []).map((tagId) => String(tagId)),
        tags: serializeTaskTags(task.tags || [], tagMap),
    };
    const isPrivateForViewer = serializedTask.isPrivate && serializedTask.userId !== viewerUserId?.toString();

    if (!isPrivateForViewer) {
        return serializedTask;
    }

    return {
        ...serializedTask,
        title: null,
        description: null,
        location: null,
        tags: null,
        tagIds: null,
        media: [],
        color: null,
    };
};

async function GETHandler(request) {
    try {        const auth = await getAuthenticatedTaskContext(request);
        if (auth.error) {
            return auth.error;
        }

        const {user, usersCollection, tasksCollection, tagsCollection} = auth;

        const {searchParams} = new URL(request.url);
        const requestedUserId = searchParams.get("userId");
        const targetUserId = requestedUserId
            ? (ObjectId.isValid(requestedUserId) ? new ObjectId(requestedUserId) : null)
            : user._id;

        if (!targetUserId) {
            return Response.json({error: 'Invalid userId'}, {status: 400});
        }

        const targetUser = await usersCollection.findOne({_id: targetUserId});

        if (!targetUser) {
            return Response.json({error: 'User not found'}, {status: 404});
        }

        const isOwner = String(targetUserId) === String(user._id);
        const isConnection = (user.connections || []).some(
            (connectionId) => String(connectionId) === String(targetUserId),
        );
        if (!isOwner && (targetUser.publicProfile === false || !isConnection)) {
            return Response.json({error: 'User not found'}, {status: 404});
        }

        const results = await tasksCollection
            .find({userId: targetUserId})            .sort({_id: -1})
            .limit(1001)
            .toArray();
        const hasMore = results.length > 1000;
        const tasks = results.slice(0, 1000);
        const tagMap = await createTaskTagMap(tagsCollection, tasks);

        return Response.json({
            tasks: tasks.map((task) => serializeTask(task, user._id, tagMap)),
            hasMore,
            resultLimit: 1000,
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {error: error});
        return Response.json({error: 'Failed to load tasks'}, {status: 500});    }}

export const GET = withApiObservability(GETHandler, {route: "/api/task/get-user-task", method: "GET"});