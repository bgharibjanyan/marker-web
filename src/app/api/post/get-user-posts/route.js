import {
    getAuthenticatedPostContext,
    serializePost,
} from "@/app/api/post/_shared";

export async function GET(request) {
    try {
        const auth = await getAuthenticatedPostContext(request);

        if (auth.error) {
            return auth.error;
        }

        const {postsCollection, userId} = auth;
        const posts = await postsCollection
            .find({userId})
            .sort({createdAt: -1, _id: -1})
            .toArray();

        return Response.json({posts: posts.map(serializePost)}, {status: 200});
    } catch (error) {
        console.error("Error in GET /post/get-user-posts:", error);
        return Response.json({error: "Failed to load posts"}, {status: 500});
    }
}
