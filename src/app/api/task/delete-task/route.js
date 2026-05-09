import clientPromise from "@/app/lib/mongodb";
import {ObjectId} from "mongodb";

export async function POST(request) {
    try {
        const authToken = request.headers.get('authorization');

        if (!authToken) {
            return Response.json({error: 'Unauthorized'}, {status: 401});
        }

        const body = await request.json();
        const taskId = body.taskId || body._id;

        if (!ObjectId.isValid(taskId)) {
            return Response.json({error: 'Invalid task id'}, {status: 400});
        }

        const client = await clientPromise;
        const db = client.db('marker');
        const sessionsCollection = db.collection('session');
        const usersCollection = db.collection('user');
        const tasksCollection = db.collection('tasks');

        const session = await sessionsCollection.findOne({token: authToken});

        if (!session?.userId) {
            return Response.json({error: 'Unauthorized'}, {status: 401});
        }

        const user = await usersCollection.findOne({_id: session.userId});

        if (!user) {
            return Response.json({error: 'User not found'}, {status: 404});
        }

        const objectId = new ObjectId(taskId);
        const result = await tasksCollection.deleteOne({_id: objectId, userId: user._id});

        if (result.deletedCount === 0) {
            return Response.json({error: 'Task not found'}, {status: 404});
        }

        await usersCollection.updateOne(
            {_id: user._id},
            {$pull: {tasks: objectId}}
        );

        return Response.json({message: 'Task deleted successfully'}, {status: 200});
    } catch (error) {
        console.log(error);
        return Response.json({error: 'Failed to delete task'}, {status: 500});
    }
}
