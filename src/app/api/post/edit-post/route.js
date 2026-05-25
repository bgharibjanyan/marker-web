import PostModel from "@/models/post/PostModel";
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
    try {
        const auth = await getAuthenticatedPostContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {postsCollection, tasksCollection, userId} = auth;
        const formData = await request.formData();
        const postId = toObjectId(formData.get("postId") || formData.get("_id"));
        const taskId = toObjectId(formData.get("task") || formData.get("taskId"));
        const title = formData.get("title");
        const description = sanitizeRichText(formData.get("description"));
        const mediaFiles = getPostMediaFiles(formData);

        if (!postId) {
            return Response.json({error: "Invalid post id"}, {status: 400});
        }

        const validationError = validatePostInput({taskId, title, mediaFiles});

        if (validationError) {
            return Response.json({error: validationError}, {status: 400});
        }

        const existingPost = await postsCollection.findOne({_id: postId, userId});

        if (!existingPost) {
            return Response.json({error: "Post not found"}, {status: 404});
        }

        const task = await getOwnedTask(tasksCollection, taskId, userId);

        if (!task) {
            return Response.json({error: "Task not found"}, {status: 404});
        }

        let media = existingPost.media || [];

        if (mediaFiles.length) {
            await removePostMedia(postId);
            media = await savePostMedia(postId, mediaFiles);
        }

        const postData = new PostModel({
            task: taskId,
            title,
            description,
            media,
            userId,
            createdAt: existingPost.createdAt,
            updatedAt: new Date(),
        });

        const result = await postsCollection.findOneAndUpdate(
            {_id: postId, userId},
            {$set: postData},
            {returnDocument: "after"}
        );
        const updatedPost = result?.value || result;

        if (!updatedPost) {
            return Response.json({error: "Post not found"}, {status: 404});
        }

        return Response.json({post: serializePost(updatedPost)}, {status: 200});
    } catch (error) {
        console.error("Error in POST /post/edit-post:", error);
        return Response.json({error: "Failed to edit post"}, {status: 500});
    }
}
