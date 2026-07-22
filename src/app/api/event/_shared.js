import {logger} from "@/server/observability/logger";
import clientPromise from "@/app/lib/mongodb";import {requireUser} from "@/app/api/_auth/session";
import {ObjectId} from "mongodb";
import {mkdir, readdir, rm, unlink, writeFile} from "fs/promises";
import path from "path";
import {ALLOWED_IMAGE_TYPES, multipartRequestLimit, validateImageFile} from "@/server/uploads/image-validation";
import {rejectOversizedRequest} from "@/server/http/request-validation";
import {withMongoTransaction} from "@/server/database/with-mongo-transaction";
import EventModel from "@/models/event/EventModel";
import TaskModel from "@/models/event/TaskModel";
import {
    createTaskTagMap,
    normalizeTaskTagNames,
    resolveTaskTagIds,
    serializeTaskTags,
    updateTaskTagUsage,
} from "@/app/api/task/_shared";import {isSupportedMapLink, MAP_LINK_ERROR} from "@/app/lib/mapLinks";import {sanitizeRichText} from "@/app/lib/richText";
export const EVENT_PAGE_SIZE = 20;
export const MAX_EVENT_IMAGES = 4;
export const MAX_EVENT_IMAGE_SIZE = 5 * 1024 * 1024;
export const EVENT_REPEAT_TYPES = ["daily", "weekly", "monthly"];
export const EVENT_WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const eventUploadDirectory = path.join(process.cwd(), "public", "uploads", "events");
const allowedImageTypes = ALLOWED_IMAGE_TYPES;

export const toObjectId = (id) => {
    const stringId = String(id || "");    return ObjectId.isValid(stringId) ? new ObjectId(stringId) : null;
};

export const getEventCollections = async () => {
    const client = await clientPromise;
    const db = client.db("marker");

    return {
        client,
        db,
        eventsCollection: db.collection("events"),
        sessionsCollection: db.collection("session"),        usersCollection: db.collection("user"),
        tasksCollection: db.collection("tasks"),
        tagsCollection: db.collection("tag"),
    };
};

export const getAuthenticatedEventContext = async (request) => {
    const auth = await requireUser(request);
    if (auth.error) {
        return auth;
    }

    const collections = await getEventCollections();
    return {...collections, user: auth.user, userId: auth.userId};
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
    const maxBytes = contentType.includes("multipart/form-data")
        ? multipartRequestLimit(MAX_EVENT_IMAGES, MAX_EVENT_IMAGE_SIZE)
        : 64 * 1024;
    const sizeError = rejectOversizedRequest(request, maxBytes);
    if (sizeError) {
        return {errorResponse: sizeError};
    }

    if (!contentType.includes("multipart/form-data")) {
        return {            body: await request.json(),
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
            const {buffer, extension} = await validateImageFile(file, {maxBytes: MAX_EVENT_IMAGE_SIZE});
            const fileName = `${startIndex + index}.${extension}`;
            const filePath = path.join(eventDirectory, fileName);

            await writeFile(filePath, buffer);
            writtenFilePaths.push(filePath);
            publicPaths.push(`/uploads/events/${eventIdString}/${fileName}`);
        }    } catch (error) {
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

export const removeSavedEventMedia = async (mediaPaths = []) => {
    await Promise.all((Array.isArray(mediaPaths) ? mediaPaths : []).map(async (mediaPath) => {
        const relativePath = String(mediaPath || "").replace(/^\/+/, "");
        const absolutePath = path.resolve(process.cwd(), "public", relativePath);
        const uploadsRoot = path.resolve(eventUploadDirectory) + path.sep;
        if (!absolutePath.startsWith(uploadsRoot)) return;
        await unlink(absolutePath).catch((error) => {
            if (error?.code !== "ENOENT") throw error;
        });
    }));
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
    if (event.title.length > 160) {
        return "Event title must be 160 characters or fewer.";
    }
    if (String(event.description || "").length > 20000) {
        return "Event description is too long.";
    }
    if (String(event.location || "").length > 500) {
        return "Event location is too long.";
    }

    if (!event.start) {        return "Start time is required.";
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

const serializeEventUser = (user) => {
    const id = String(user?._id || user?.id || "");

    return {
        id,
        _id: id,
        name: [user?.firstname, user?.lastname].filter(Boolean).join(" ") || user?.login || user?.email || "Unnamed user",
        login: user?.login || "",
        profilePicture: user?.profilePicture || "",
    };
};

export const createEventUserMap = async (usersCollection, events = []) => {
    const userIds = [
        ...new Set(events.map((event) => event?.userId)
            .map((userId) => String(userId || ""))
            .filter((userId) => ObjectId.isValid(userId)))    ].map((userId) => new ObjectId(userId));

    if (!userIds.length) {
        return new Map();
    }

    const users = await usersCollection
        .find({_id: {$in: userIds}}, {projection: {password: 0}})
        .toArray();

    return new Map(users.map((user) => [String(user._id), serializeEventUser(user)]));
};

export const serializeEvent = (event, tagMap = new Map(), userMap = new Map(), currentUserId = "") => {
    const id = String(event?._id || "");
    const subscribers = (Array.isArray(event?.subscribers) ? event.subscribers : [])
        .map((subscriberId) => String(subscriberId || ""))
        .filter(Boolean);
    const userId = String(event?.userId || "");
    const currentUserIdString = String(currentUserId || "");

    return {
        id,
        _id: id,
        userId,
        owner: userMap.get(userId) || null,
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
        subscriberCount: subscribers.length,
        isSubscribed: currentUserIdString ? subscribers.includes(currentUserIdString) : false,        createdAt: event?.createdAt || null,
        updatedAt: event?.updatedAt || null,
    };
};

export const prepareEventDocument = async (tagsCollection, body = {}, mediaFiles = [], session = null) => {
    const mediaValidationError = validateEventMediaFiles(mediaFiles, normalizeMedia(body.media));

    if (mediaValidationError) {
        return {error: mediaValidationError};
    }

    const tagNames = normalizeTaskTagNames(body.tags);
    if (tagNames.length > 20 || tagNames.some((tag) => tag.length > 40)) {
        return {error: "Use at most 20 tags, each 40 characters or fewer."};
    }

    const validationCandidate = normalizeEventData(body, []);
    const validationError = validateEventData(validationCandidate);
    if (validationError) {
        return {error: validationError};
    }

    const tagIds = await resolveTaskTagIds(tagsCollection, body.tags, session);
    return {eventData: normalizeEventData(body, tagIds), tagIds};
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

export const deleteEventWithSubscriptions = async ({
    client,
    eventsCollection,
    tasksCollection,
    usersCollection,
    tagsCollection,
    eventId,
}) => {
    const eventObjectId = toObjectId(eventId);
    if (!eventObjectId) {
        return {error: Response.json({error: "Invalid event id"}, {status: 400})};
    }

    const result = await withMongoTransaction(client, async (session) => {
        const event = await eventsCollection.findOne({_id: eventObjectId}, {session});
        if (!event) return null;

        const cursor = tasksCollection
            .find({sourceEventId: eventObjectId}, {session, projection: {_id: 1}})
            .batchSize(500);
        let userOperations = [];
        let deletedTaskCount = 0;

        for await (const task of cursor) {
            userOperations.push({
                updateOne: {
                    filter: {tasks: task._id},
                    update: {$pull: {tasks: task._id}},
                },
            });
            deletedTaskCount += 1;
            if (userOperations.length === 500) {
                await usersCollection.bulkWrite(userOperations, {session, ordered: false});
                userOperations = [];
            }
        }
        if (userOperations.length) {
            await usersCollection.bulkWrite(userOperations, {session, ordered: false});
        }

        await tasksCollection.deleteMany({sourceEventId: eventObjectId}, {session});
        await eventsCollection.deleteOne({_id: eventObjectId}, {session});
        await updateEventTagUsage(tagsCollection, event.tags || [], [], session);
        return {event, deletedTaskCount};
    });

    if (!result) {
        return {error: Response.json({error: "Event not found"}, {status: 404})};
    }

    await removeEventMedia(eventObjectId).catch((cleanupError) => {
        logger.error("api.handler.error", {message: "Failed to remove deleted event media:", error: cleanupError});
    });    return result;
};