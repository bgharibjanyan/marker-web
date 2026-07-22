import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {enforceRateLimit} from "@/server/security/rate-limiter";import {withMongoTransaction} from "@/server/database/with-mongo-transaction";
import PostModel from "@/models/post/PostModel";
import {ObjectId} from "mongodb";
import {multipartRequestLimit, UploadValidationError} from "@/server/uploads/image-validation";import {rejectOversizedRequest} from "@/server/http/request-validation";
import {sanitizeRichText} from "@/app/lib/richText";
import {
    getAuthenticatedPostContext,
    getOwnedTask,
    getPostMediaFiles,
    removePostMedia,
    savePostMedia,    serializePost,
    toObjectId,
    validatePostInput,
} from "@/app/api/post/_shared";

export const runtime = "nodejs";


async function POSTHandler(request) {
    let postId = null;    let mediaWritten = false;    try {
        const auth = await getAuthenticatedPostContext(request);

        if (auth.error) {
            return auth.error;
        }

        const endpointRateLimit = await enforceRateLimit({
            db: auth.db,
            scope: "post-create",
            identifier: String(auth.userId),
            limit: 20,
            windowMs: 3600000,
        });
        if (endpointRateLimit) return endpointRateLimit;

        const sizeError = rejectOversizedRequest(
            request,
            multipartRequestLimit(4, 5 * 1024 * 1024),
        );
        if (sizeError) return sizeError;

        const {client, postsCollection, tasksCollection, usersCollection, userId} = auth;
        const formData = await request.formData();
        const taskId = toObjectId(formData.get("task") || formData.get("taskId"));
        const title = formData.get("title");
        const description = sanitizeRichText(formData.get("description"));
        const mediaFiles = getPostMediaFiles(formData);
        const validationError = validatePostInput({taskId, title, description, mediaFiles});
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

        await withMongoTransaction(client, async (session) => {
            await postsCollection.insertOne(postDocument, {session});
            await usersCollection.updateOne(
                {_id: userId},
                {$addToSet: {posts: postId}},
                {session},
            );
        });

        return Response.json({post: serializePost(postDocument)}, {status: 201});
    } catch (error) {        if (postId && mediaWritten) {
            await removePostMedia(postId);
        }

        if (error instanceof UploadValidationError) {
            return Response.json({error: error.message}, {status: error.status});
        }

        logger.error("api.handler.error", {message: "Error in POST /post/create-post:", error: error});
        return Response.json({error: "Failed to create post"}, {status: 500});    }}

export const POST = withApiObservability(POSTHandler, {route: "/api/post/create-post", method: "POST"});