import {ObjectId} from "mongodb";
import {normalizeTags, serializeTag, updateTagUsage} from "@/app/api/profile/_shared";

const toObjectId = (id) => {
    const stringId = String(id || "");
    return ObjectId.isValid(stringId) ? new ObjectId(stringId) : null;
};

export const normalizeTaskTagNames = (tags = []) => {
    const normalizedTags = Array.isArray(tags) ? tags : [];

    return normalizeTags(normalizedTags.map((tag) => {
        if (typeof tag === "string") {
            return tag;
        }

        return tag?.name || "";
    }));
};

export const resolveTaskTagIds = async (tagsCollection, tags = []) => {
    const tagNames = normalizeTaskTagNames(tags);

    if (!tagNames.length) {
        return [];
    }

    await tagsCollection.bulkWrite(tagNames.map((name) => ({
        updateOne: {
            filter: {name},
            update: {$setOnInsert: {name, usage: 0, createdAt: new Date()}},
            upsert: true,
        },
    })));

    const tagDocs = await tagsCollection
        .find({name: {$in: tagNames}})
        .toArray();
    const tagsByName = new Map(tagDocs.map((tag) => [tag.name, tag]));

    return tagNames
        .map((name) => tagsByName.get(name)?._id)
        .filter(Boolean);
};

export const getTagNamesByIds = async (tagsCollection, tagIds = []) => {
    const ids = (Array.isArray(tagIds) ? tagIds : [])
        .map(toObjectId)
        .filter(Boolean);

    if (!ids.length) {
        return [];
    }

    const tags = await tagsCollection
        .find({_id: {$in: ids}})
        .toArray();

    return tags.map((tag) => tag.name).filter(Boolean);
};

export const updateTaskTagUsage = async (tagsCollection, previousTagIds = [], nextTags = []) => {
    const previousTagNames = await getTagNamesByIds(tagsCollection, previousTagIds);
    const nextTagNames = normalizeTaskTagNames(nextTags);

    await updateTagUsage(tagsCollection, previousTagNames, nextTagNames);
};

export const createTaskTagMap = async (tagsCollection, tasks = []) => {
    const tagIds = [
        ...new Set(tasks.flatMap((task) => (
            (Array.isArray(task.tags) ? task.tags : [])
                .map((tagId) => String(tagId || ""))
                .filter((tagId) => ObjectId.isValid(tagId))
        ))),
    ].map((tagId) => new ObjectId(tagId));

    if (!tagIds.length) {
        return new Map();
    }

    const tags = await tagsCollection
        .find({_id: {$in: tagIds}})
        .toArray();

    return new Map(tags.map((tag) => [String(tag._id), serializeTag(tag)]));
};

export const serializeTaskTags = (tagIds = [], tagMap = new Map()) => (
    (Array.isArray(tagIds) ? tagIds : [])
        .map((tagId) => tagMap.get(String(tagId)))
        .filter(Boolean)
);
