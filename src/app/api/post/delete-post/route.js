import {
    getAuthenticatedPostContext,
    removePostMedia,
    toObjectId,
} from "@/app/api/post/_shared";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const auth = await getAuthenticatedPostContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {postsCollection, usersCollection, userId} = auth;
        const body = await request.json();
        const postId = toObjectId(body?.postId || body?._id);

        if (!postId) {
            return Response.json({error: "Invalid post id"}, {status: 400});
        }

        const result = await postsCollection.findOneAndDelete({_id: postId, userId});
        const deletedPost = result?.value || result;

        if (!deletedPost) {
            return Response.json({error: "Post not found"}, {status: 404});
        }

        await usersCollection.updateOne(
            {_id: userId},
            {$pull: {posts: postId}}
        );
        await removePostMedia(postId);

        return Response.json({message: "Post deleted successfully"}, {status: 200});
    } catch (error) {
        console.error("Error in POST /post/delete-post:", error);
        return Response.json({error: "Failed to delete post"}, {status: 500});
    }
}
