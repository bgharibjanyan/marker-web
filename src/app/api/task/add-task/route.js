import clientPromise from "@/app/lib/mongodb";
import TaskModel from "@/models/event/TaskModel";
import {resolveTaskTagIds, updateTaskTagUsage} from "@/app/api/task/_shared";

const validateTask = (task) => {
    const isDailyRepeat = task.repeat && task.repeatType === 'daily';
    const isWeeklyRepeat = task.repeat && task.repeatType === 'weekly';
    const isCalendarDisabledRepeat = isDailyRepeat || isWeeklyRepeat;

    if (!task.title?.trim()) {
        return 'Event name is required.';
    }

    if (!task.start) {
        return 'Start time is required.';
    }

    if (!isCalendarDisabledRepeat && (!task.date || !task.monthday)) {
        return 'Day is required.';
    }

    if (task.repeat && !task.repeatType) {
        return 'Repeat type is required.';
    }

    if (isWeeklyRepeat && (!Array.isArray(task.weekdays) || task.weekdays.length === 0)) {
        return 'Select at least one weekday.';
    }

    if (task.repeat && task.repeatType === 'monthly' && !task.monthday) {
        return 'Select a day for monthly repeat.';
    }

    return '';
};

export async function POST(request) {
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

        const body = await request.json();
        const validationError = validateTask(body);

        if (validationError) {
            return Response.json({error: validationError}, {status: 400});
        }

        const tagIds = await resolveTaskTagIds(tagsCollection, body.tags);
        const taskData = new TaskModel({
            ...body,
            tags: tagIds,
        });
        taskData.setUser(user._id);

        const result = await tasksCollection.insertOne(taskData);
        await updateTaskTagUsage(tagsCollection, [], body.tags);

        await usersCollection.updateOne(
            {_id: user._id},
            {$addToSet: {tasks: result.insertedId}}
        );

        return Response.json({
            message: 'Task added successfully',
            taskId: result.insertedId.toString(),
        }, {status: 200});
    } catch (error) {
        console.log(error);
        return Response.json({error: 'Failed to create task'}, {status: 500});
    }
}
