import clientPromise from "@/app/lib/mongodb";

const serializeTask = (task) => ({
    ...task,
    _id: task._id?.toString(),
    userId: task.userId?.toString(),
});

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

        const session = await sessionsCollection.findOne({token: authToken});

        if (!session?.userId) {
            return Response.json({error: 'Unauthorized'}, {status: 401});
        }

        const user = await usersCollection.findOne({_id: session.userId});

        if (!user) {
            return Response.json({error: 'User not found'}, {status: 404});
        }

        const tasks = await tasksCollection
            .find({userId: user._id})
            .sort({start: 1})
            .toArray();

        return Response.json({tasks: tasks.map(serializeTask)}, {status: 200});
    } catch (error) {
        console.log(error);
        return Response.json({error: 'Failed to load tasks'}, {status: 500});
    }
}
