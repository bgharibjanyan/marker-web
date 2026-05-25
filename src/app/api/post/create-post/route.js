import PostModel from "@/models/post/PostModel";
import {ObjectId} from "mongodb";
import {sanitizeRichText} from "@/app/lib/richText";
import {
    getAuthenticatedPostContext,
    getOwnedTask,
    getPostMediaFiles,
    removePostMedia,
    savePostMedia,
    serializePost,
    toObjectId,
    validatePostInput,
} from "@/app/api/post/_shared";

export const runtime = "nodejs";

export async function POST(request) {
    let postId = null;
    let mediaWritten = false;

    try {
        const auth = await getAuthenticatedPostContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {postsCollection, tasksCollection, usersCollection, userId} = auth;
        const formData = await request.formData();
        const taskId = toObjectId(formData.get("task") || formData.get("taskId"));
        const title = formData.get("title");
        const description = sanitizeRichText(formData.get("description"));
        const mediaFiles = getPostMediaFiles(formData);
        const validationError = validatePostInput({taskId, title, mediaFiles});

        if (validationError) {
            return Response.json({error: validationError}, {status: 400});
        }

        const task = await getOwnedTask(tasksCollection, taskId, userId);

        if (!task) {
            return Response.json({error: "Task not found"}, {status: 404});
        }

        postId = new ObjectId();
        const media = await savePostMedia(postId, mediaFiles);
        mediaWritten = media.length > 0;

        const post = new PostModel({
            task: taskId,
            title,
            description,
            media,
            userId,
        });
        const postDocument = {
            _id: postId,
            ...post,
        };

        await postsCollection.insertOne(postDocument);
        await usersCollection.updateOne(
            {_id: userId},
            {$addToSet: {posts: postId}}
        );

        return Response.json({post: serializePost(postDocument)}, {status: 201});
    } catch (error) {
        if (postId && mediaWritten) {
            await removePostMedia(postId);
        }

        console.error("Error in POST /post/create-post:", error);
        return Response.json({error: "Failed to create post"}, {status: 500});
    }
}
