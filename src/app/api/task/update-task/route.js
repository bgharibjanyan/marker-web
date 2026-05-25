import clientPromise from "@/app/lib/mongodb";
import TaskModel from "@/models/event/TaskModel";
import {ObjectId} from "mongodb";
import {resolveTaskTagIds, updateTaskTagUsage} from "@/app/api/task/_shared";
import {sanitizeRichText} from "@/app/lib/richText";

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

        const body = await request.json();
        const taskId = body.taskId || body._id;

        if (!ObjectId.isValid(taskId)) {
            return Response.json({error: 'Invalid task id'}, {status: 400});
        }

        const validationError = validateTask(body);

        if (validationError) {
            return Response.json({error: validationError}, {status: 400});
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

        const objectId = new ObjectId(taskId);
        const existingTask = await tasksCollection.findOne({_id: objectId, userId: user._id});

        if (!existingTask) {
            return Response.json({error: 'Task not found'}, {status: 404});
        }

        const tagIds = await resolveTaskTagIds(tagsCollection, body.tags);
        const taskData = new TaskModel({
            ...body,
            description: sanitizeRichText(body.description) || null,
            tags: tagIds,
        });
        taskData.setUser(user._id);

        const result = await tasksCollection.updateOne(
            {_id: objectId, userId: user._id},
            {$set: taskData}
        );

        if (result.matchedCount === 0) {
            return Response.json({error: 'Task not found'}, {status: 404});
        }

        await updateTaskTagUsage(tagsCollection, existingTask.tags || [], body.tags);

        return Response.json({message: 'Task updated successfully'}, {status: 200});
    } catch (error) {
        console.log(error);
        return Response.json({error: 'Failed to update task'}, {status: 500});
    }
}
