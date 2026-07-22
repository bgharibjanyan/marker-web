import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {withMongoTransaction} from "@/server/database/with-mongo-transaction";import {
    getAuthenticatedPostContext,
    removePostMedia,    toObjectId,
} from "@/app/api/post/_shared";

export const runtime = "nodejs";

async function POSTHandler(request) {
    try {        const auth = await getAuthenticatedPostContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {client, postsCollection, usersCollection, userId} = auth;
        const body = await request.json();
        const postId = toObjectId(body?.postId || body?._id);
        if (!postId) {
            return Response.json({error: "Invalid post id"}, {status: 400});
        }

        const deletedPost = await withMongoTransaction(client, async (session) => {
            const result = await postsCollection.findOneAndDelete(
                {_id: postId, userId},
                {session},
            );
            const post = result?.value || result;
            if (!post) return null;

            await usersCollection.updateOne(
                {_id: userId},
                {$pull: {posts: postId}},
                {session},
            );
            return post;
        });

        if (!deletedPost) {
            return Response.json({error: "Post not found"}, {status: 404});
        }

        await removePostMedia(postId).catch((cleanupError) => {
            logger.error("api.handler.error", {message: "Failed to remove deleted post media:", error: cleanupError});
        });
        return Response.json({message: "Post deleted successfully"}, {status: 200});
    } catch (error) {        logger.error("api.handler.error", {message: "Error in POST /post/delete-post:", error: error});
        return Response.json({error: "Failed to delete post"}, {status: 500});    }
}

export const POST = withApiObservability(POSTHandler, {route: "/api/post/delete-post", method: "POST"});