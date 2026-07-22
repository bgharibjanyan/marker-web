import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {    getAuthenticatedPostContext,
    serializePost,
    toObjectId,
} from "@/app/api/post/_shared";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;

async function GETHandler(request) {
    try {        const auth = await getAuthenticatedPostContext(request);
        if (auth.error) return auth.error;

        const {searchParams} = new URL(request.url);
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
        const cursorValue = searchParams.get("cursor");
        const cursor = cursorValue ? toObjectId(cursorValue) : null;
        if (cursorValue && !cursor) {
            return Response.json({error: "Invalid cursor"}, {status: 400});
        }

        const filter = {
            userId: auth.userId,
            ...(cursor ? {_id: {$lt: cursor}} : {}),
        };
        const results = await auth.postsCollection
            .find(filter)
            .sort({_id: -1})
            .limit(limit + 1)
            .toArray();
        const hasMore = results.length > limit;
        const posts = results.slice(0, limit);

        return Response.json({
            posts: posts.map(serializePost),
            hasMore,
            nextCursor: hasMore ? String(posts.at(-1)?._id || "") : null,
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error in GET /post/get-user-posts:", error: error});
        return Response.json({error: "Failed to load posts"}, {status: 500});    }}

export const GET = withApiObservability(GETHandler, {route: "/api/post/get-user-posts", method: "GET"});