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

export const validateTaskInput = (task = {}) => {
    const title = String(task.title || "").trim();
    const description = String(task.description || "");
    const location = String(task.location || "");
    const tags = normalizeTaskTagNames(task.tags);
    const isDailyRepeat = task.repeat && task.repeatType === "daily";
    const isWeeklyRepeat = task.repeat && task.repeatType === "weekly";
    const isCalendarDisabledRepeat = isDailyRepeat || isWeeklyRepeat;

    if (!title) return "Event name is required.";
    if (title.length > 160) return "Event name must be 160 characters or fewer.";
    if (description.length > 20000) return "Description is too long.";
    if (location.length > 500) return "Location is too long.";
    if (tags.length > 20 || tags.some((tag) => tag.length > 40)) {
        return "Use at most 20 tags, each 40 characters or fewer.";
    }
    if (!task.start || String(task.start).length > 32) return "Start time is required.";
    if (task.end && String(task.end).length > 32) return "End time is invalid.";
    if (!isCalendarDisabledRepeat && (!task.date || !task.monthday)) return "Day is required.";
    if (task.repeat && !["daily", "weekly", "monthly"].includes(task.repeatType)) {
        return "Repeat type is invalid.";
    }
    if (isWeeklyRepeat && (!Array.isArray(task.weekdays) || task.weekdays.length === 0)) {
        return "Select at least one weekday.";
    }
    if (task.repeat && task.repeatType === "monthly" && !task.monthday) {
        return "Select a day for monthly repeat.";
    }
    return "";
};

export const resolveTaskTagIds = async (tagsCollection, tags = [], session = null) => {
    const tagNames = normalizeTaskTagNames(tags);

    if (!tagNames.length) {        return [];
    }

    await tagsCollection.bulkWrite(tagNames.map((name) => ({
        updateOne: {
            filter: {name},
            update: {$setOnInsert: {name, usage: 0, createdAt: new Date()}},
            upsert: true,
        },
    })), {session});

    const tagDocs = await tagsCollection
        .find({name: {$in: tagNames}}, {session})
        .toArray();
    const tagsByName = new Map(tagDocs.map((tag) => [tag.name, tag]));
    return tagNames
        .map((name) => tagsByName.get(name)?._id)
        .filter(Boolean);
};

export const getTagNamesByIds = async (tagsCollection, tagIds = [], session = null) => {
    const ids = (Array.isArray(tagIds) ? tagIds : [])
        .map(toObjectId)
        .filter(Boolean);
    if (!ids.length) {
        return [];
    }

    const tags = await tagsCollection
        .find({_id: {$in: ids}}, {session})
        .toArray();

    return tags.map((tag) => tag.name).filter(Boolean);
};

export const updateTaskTagUsage = async (tagsCollection, previousTagIds = [], nextTags = [], session = null) => {
    const previousTagNames = await getTagNamesByIds(tagsCollection, previousTagIds, session);
    const nextTagNames = normalizeTaskTagNames(nextTags);

    await updateTagUsage(tagsCollection, previousTagNames, nextTagNames, {session});
};

export const createTaskTagMap = async (tagsCollection, tasks = []) => {    const tagIds = [
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
