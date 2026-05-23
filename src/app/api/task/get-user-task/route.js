import clientPromise from "@/app/lib/mongodb";
import {ObjectId} from "mongodb";
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

export async function GET(request) {
    try {
        const authToken = request.headers.get('authorization');

        if (!authToken) {
            return Response.json({error: 'Unauthorized'}, {status: 401});
        }

        const client = await clientPromise;
        const db = client.db('marker');
        const sessionsCollection = db.collection('session');
        const usersCollection = db.collection('user');
        const tasksCollection = db.collection('tasks');
        const tagsCollection = db.collection('tag');

        const session = await sessionsCollection.findOne({token: authToken});

        if (!session?.userId) {
            return Response.json({error: 'Unauthorized'}, {status: 401});
        }

        const user = await usersCollection.findOne({_id: session.userId});

        if (!user) {
            return Response.json({error: 'User not found'}, {status: 404});
        }

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

        const tasks = await tasksCollection
            .find({userId: targetUserId})
            .sort({start: 1})
            .toArray();
        const tagMap = await createTaskTagMap(tagsCollection, tasks);

        return Response.json({tasks: tasks.map((task) => serializeTask(task, user._id, tagMap))}, {status: 200});
    } catch (error) {
        console.log(error);
        return Response.json({error: 'Failed to load tasks'}, {status: 500});
    }
}
