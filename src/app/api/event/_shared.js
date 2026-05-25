import clientPromise from "@/app/lib/mongodb";
import {ObjectId} from "mongodb";
import {mkdir, readdir, rm, unlink, writeFile} from "fs/promises";
import path from "path";
import EventModel from "@/models/event/EventModel";
import TaskModel from "@/models/event/TaskModel";
import {createTaskTagMap, resolveTaskTagIds, serializeTaskTags, updateTaskTagUsage} from "@/app/api/task/_shared";
import {isSupportedMapLink, MAP_LINK_ERROR} from "@/app/lib/mapLinks";
import {sanitizeRichText} from "@/app/lib/richText";

export const EVENT_PAGE_SIZE = 20;
export const MAX_EVENT_IMAGES = 4;
export const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024;
export const EVENT_REPEAT_TYPES = ["daily", "weekly", "monthly"];
export const EVENT_WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const eventUploadDirectory = path.join(process.cwd(), "public", "uploads", "events");
const allowedImageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

export const toObjectId = (id) => {
    const stringId = String(id || "");
    return ObjectId.isValid(stringId) ? new ObjectId(stringId) : null;
};

export const getEventCollections = async () => {
    const client = await clientPromise;
    const db = client.db("marker");

    return {
        db,
        eventsCollection: db.collection("events"),
        sessionsCollection: db.collection("session"),
        usersCollection: db.collection("user"),
        tasksCollection: db.collection("tasks"),
        tagsCollection: db.collection("tag"),
    };
};

export const getAuthenticatedEventContext = async (request) => {
    const token = request.headers.get("authorization");

    if (!token) {
        return {error: Response.json({error: "Unauthorized"}, {status: 401})};
    }

    const collections = await getEventCollections();
    const session = await collections.sessionsCollection.findOne({token});
    const userId = toObjectId(session?.userId);

    if (!userId) {
        return {error: Response.json({error: "Unauthorized"}, {status: 401})};
    }

    const user = await collections.usersCollection.findOne({_id: userId}, {projection: {password: 0}});

    if (!user) {
        return {error: Response.json({error: "User not found"}, {status: 404})};
    }

    return {...collections, user, userId};
};

const normalizeString = (value) => String(value || "").trim();

const normalizeMedia = (media = []) => (
    (Array.isArray(media) ? media : String(media || "").split(/\n|,/))
        .map(normalizeString)
        .filter(Boolean)
);

export const getEventMediaFiles = (formData) => (
    formData
        .getAll("media")
        .filter((file) => file && typeof file.arrayBuffer === "function" && file.size > 0)
);

export const parseEventRequestBody = async (request) => {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
        return {
            body: await request.json(),
            mediaFiles: [],
            isMultipart: false,
        };
    }

    const formData = await request.formData();
    const rawEvent = formData.get("event");
    const rawEventText = rawEvent && typeof rawEvent.text === "function"
        ? await rawEvent.text()
        : String(rawEvent || "");
    const body = rawEventText ? JSON.parse(rawEventText) : {};

    return {
        body,
        mediaFiles: getEventMediaFiles(formData),
        isMultipart: true,
    };
};

export const validateEventMediaFiles = (mediaFiles = [], existingMedia = []) => {
    if (existingMedia.length + mediaFiles.length > MAX_EVENT_IMAGES) {
        return `Events can include up to ${MAX_EVENT_IMAGES} images.`;
    }

    for (const file of mediaFiles) {
        if (!allowedImageTypes[file.type]) {
            return "Only JPG, PNG, WEBP, and GIF images are allowed.";
        }

        if (file.size > MAX_EVENT_IMAGE_SIZE) {
            return "Each image must be smaller than 5MB.";
        }
    }

    return "";
};

const getNextEventMediaIndex = async (eventDirectory) => {
    try {
        const fileNames = await readdir(eventDirectory);
        const indexes = fileNames
            .map((fileName) => Number(fileName.match(/^(\d+)\.[a-z0-9]+$/i)?.[1] || 0))
            .filter(Boolean);

        return indexes.length ? Math.max(...indexes) + 1 : 1;
    } catch (error) {
        if (error?.code === "ENOENT") {
            return 1;
        }

        throw error;
    }
};

export const saveEventMedia = async (eventId, mediaFiles = []) => {
    if (!mediaFiles.length) {
        return [];
    }

    const eventIdString = String(eventId);
    const eventDirectory = path.join(eventUploadDirectory, eventIdString);
    const publicPaths = [];
    const writtenFilePaths = [];

    await mkdir(eventDirectory, {recursive: true});

    try {
        const startIndex = await getNextEventMediaIndex(eventDirectory);

        for (let index = 0; index < mediaFiles.length; index += 1) {
            const file = mediaFiles[index];
            const extension = allowedImageTypes[file.type];
            const fileName = `${startIndex + index}.${extension}`;
            const filePath = path.join(eventDirectory, fileName);
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            await writeFile(filePath, fileBuffer);
            writtenFilePaths.push(filePath);
            publicPaths.push(`/uploads/events/${eventIdString}/${fileName}`);
        }
    } catch (error) {
        await Promise.all(writtenFilePaths.map((filePath) => unlink(filePath).catch(() => null)));
        throw error;
    }

    return publicPaths;
};

export const removeEventMedia = async (eventId) => {
    if (!eventId) return;

    await rm(path.join(eventUploadDirectory, String(eventId)), {
        recursive: true,
        force: true,
    });
};

const normalizeWeekdays = (weekdays = []) => (
    [...new Set(
        (Array.isArray(weekdays) ? weekdays : [])
            .map((weekday) => String(weekday || "").toLowerCase())
            .filter((weekday) => EVENT_WEEKDAYS.includes(weekday))
    )]
);

const getMonthdayFromDate = (date) => {
    const match = String(date || "").match(/^\d{4}-\d{2}-(\d{2})$/);

    return match ? Number(match[1]) : null;
};

export const normalizeEventData = (body = {}, tagIds = []) => {
    const repeat = Boolean(body.repeat);
    const repeatType = repeat && EVENT_REPEAT_TYPES.includes(body.repeatType) ? body.repeatType : null;
    const isCalendarDisabledRepeat = repeat && (repeatType === "daily" || repeatType === "weekly");
    const date = isCalendarDisabledRepeat ? null : normalizeString(body.date) || null;
    const monthday = isCalendarDisabledRepeat
        ? null
        : Number(body.monthday || getMonthdayFromDate(date) || 0) || null;

    return new EventModel({
        title: normalizeString(body.title),
        description: sanitizeRichText(body.description) || null,
        start: normalizeString(body.start) || null,
        end: normalizeString(body.end) || null,
        location: normalizeString(body.location) || null,
        tags: tagIds,
        repeat,
        repeatType,
        weekdays: repeatType === "weekly" ? normalizeWeekdays(body.weekdays) : [],
        monthday,
        color: normalizeString(body.color) || "#7c72ff",
        date,
        isPrivate: Boolean(body.isPrivate),
        media: normalizeMedia(body.media),
        subscribers: Array.isArray(body.subscribers) ? body.subscribers.map(toObjectId).filter(Boolean) : [],
        userId: body.userId || null,
    });
};

export const validateEventData = (event) => {
    const isDailyRepeat = event.repeat && event.repeatType === "daily";
    const isWeeklyRepeat = event.repeat && event.repeatType === "weekly";
    const isCalendarDisabledRepeat = isDailyRepeat || isWeeklyRepeat;

    if (!event.title?.trim()) {
        return "Event title is required.";
    }

    if (!event.start) {
        return "Start time is required.";
    }

    if (event.location && !isSupportedMapLink(event.location)) {
        return MAP_LINK_ERROR;
    }

    if (!isCalendarDisabledRepeat && (!event.date || !event.monthday)) {
        return "Event date is required.";
    }

    if (event.repeat && !event.repeatType) {
        return "Repeat type is required.";
    }

    if (isWeeklyRepeat && (!Array.isArray(event.weekdays) || event.weekdays.length === 0)) {
        return "Select at least one weekday.";
    }

    if (event.repeat && event.repeatType === "monthly" && !event.monthday) {
        return "Select a day for monthly repeat.";
    }

    return "";
};

export const createEventTagMap = createTaskTagMap;

export const serializeEvent = (event, tagMap = new Map()) => {
    const id = String(event?._id || "");
    const subscribers = (Array.isArray(event?.subscribers) ? event.subscribers : [])
        .map((subscriberId) => String(subscriberId || ""))
        .filter(Boolean);

    return {
        id,
        _id: id,
        title: event?.title || "",
        description: event?.description || "",
        start: event?.start || "",
        end: event?.end || "",
        location: event?.location || "",
        tags: serializeTaskTags(event?.tags || [], tagMap),
        tagIds: (event?.tags || []).map((tagId) => String(tagId)),
        repeat: Boolean(event?.repeat),
        repeatType: event?.repeatType || "",
        weekdays: Array.isArray(event?.weekdays) ? event.weekdays : [],
        monthday: event?.monthday ?? "",
        color: event?.color || "#7c72ff",
        date: event?.date || "",
        isPrivate: Boolean(event?.isPrivate),
        media: Array.isArray(event?.media) ? event.media : [],
        subscribers,
        subscriberCount: subscribers.length,
        createdAt: event?.createdAt || null,
        updatedAt: event?.updatedAt || null,
    };
};

export const prepareEventDocument = async (tagsCollection, body = {}, mediaFiles = []) => {
    const mediaValidationError = validateEventMediaFiles(mediaFiles, normalizeMedia(body.media));

    if (mediaValidationError) {
        return {error: mediaValidationError};
    }

    const tagIds = await resolveTaskTagIds(tagsCollection, body.tags);
    const eventData = normalizeEventData(body, tagIds);
    const validationError = validateEventData(eventData);

    if (validationError) {
        return {error: validationError};
    }

    return {eventData, tagIds};
};

export const updateEventTagUsage = updateTaskTagUsage;

export const getEventTaskFields = (event) => ({
    title: event.title || "",
    description: sanitizeRichText(event.description) || null,
    start: event.start || null,
    end: event.end || null,
    location: event.location || null,
    tags: Array.isArray(event.tags) ? event.tags : [],
    repeat: Boolean(event.repeat),
    repeatType: event.repeat ? event.repeatType || null : null,
    weekdays: event.repeat && event.repeatType === "weekly" ? event.weekdays || [] : [],
    monthday: event.repeat && (event.repeatType === "daily" || event.repeatType === "weekly") ? null : event.monthday || null,
    color: event.color || "#7c72ff",
    date: event.repeat && (event.repeatType === "daily" || event.repeatType === "weekly") ? null : event.date || null,
    isPrivate: false,
    media: Array.isArray(event.media) ? event.media : [],
    sourceType: "event",
    sourceEventId: event._id,
});

export const createSubscribedTask = (event, userId) => {
    const taskData = new TaskModel({
        ...getEventTaskFields(event),
        userId,
    });

    return {
        ...taskData,
        sourceType: "event",
        sourceEventId: event._id,
        subscribedAt: new Date(),
    };
};

export const deleteEventWithSubscriptions = async ({eventsCollection, tasksCollection, usersCollection, tagsCollection, eventId}) => {
    const eventObjectId = toObjectId(eventId);

    if (!eventObjectId) {
        return {error: Response.json({error: "Invalid event id"}, {status: 400})};
    }

    const event = await eventsCollection.findOne({_id: eventObjectId});

    if (!event) {
        return {error: Response.json({error: "Event not found"}, {status: 404})};
    }

    const subscribedTasks = await tasksCollection
        .find({sourceEventId: eventObjectId})
        .project({_id: 1})
        .toArray();
    const subscribedTaskIds = subscribedTasks.map((task) => task._id);

    await eventsCollection.deleteOne({_id: eventObjectId});
    await removeEventMedia(eventObjectId);

    if (subscribedTaskIds.length) {
        await tasksCollection.deleteMany({_id: {$in: subscribedTaskIds}});
        await usersCollection.updateMany(
            {tasks: {$in: subscribedTaskIds}},
            {$pull: {tasks: {$in: subscribedTaskIds}}}
        );
    }

    await updateEventTagUsage(tagsCollection, event.tags || [], []);

    return {event, deletedTaskCount: subscribedTaskIds.length};
};
