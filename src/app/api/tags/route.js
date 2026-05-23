import {getProfileCollections, normalizeTagName, serializeTag} from "@/app/api/profile/_shared";

export async function GET(request) {
    try {
        const {searchParams} = new URL(request.url);
        const query = normalizeTagName(searchParams.get("query"));
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 24, 1), 50);
        const {tagsCollection} = await getProfileCollections();
        const filter = query ? {name: {$regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i"}} : {};
        const tags = await tagsCollection
            .find(filter)
            .sort({usage: -1, name: 1})
            .limit(limit)
            .toArray();

        return Response.json({tags: tags.map(serializeTag)}, {status: 200});
    } catch (error) {
        console.error("Error in GET /tags:", error);
        return Response.json({error: "Failed to load tags"}, {status: 500});
    }
}
