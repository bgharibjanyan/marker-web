import {getAuthCollections, getOptionalUser, requireUser} from "@/app/api/_auth/session";
import {ObjectId} from "mongodb";
import {isValidEmail, normalizeBoundedString} from "@/server/http/request-validation";

export const profileEditableFields = [
    "firstname",    "lastname",
    "login",
    "email",
    "age",
    "sex",
    "address",
    "country",
    "city",
    "timezone",
    "publicProfile",
    "allowMessages",
    "notifications",
];

export const toObjectId = (id) => {
    const stringId = String(id || "");
    return ObjectId.isValid(stringId) ? new ObjectId(stringId) : null;
};

export const normalizeTagName = (value) => (
    String(value || "")
        .trim()
        .replace(/^#+/, "")
        .replace(/\s+/g, " ")
        .toLowerCase()
);

export const normalizeTags = (tags = []) => {
    const normalizedTags = Array.isArray(tags) ? tags : [];

    return [...new Set(
        normalizedTags
            .map(normalizeTagName)
            .filter(Boolean)
    )];
};

const profileStringLimits = {
    firstname: {min: 1, max: 80},
    lastname: {max: 80},
    login: {min: 3, max: 40},
    email: {min: 3, max: 254, lowercase: true},
    address: {max: 200},
    country: {max: 80},
    city: {max: 80},
    timezone: {max: 80},
};

export const validateProfileUpdate = (body = {}) => {
    const data = {};

    for (const field of profileEditableFields) {
        if (!Object.prototype.hasOwnProperty.call(body, field)) continue;

        if (Object.prototype.hasOwnProperty.call(profileStringLimits, field)) {
            const value = normalizeBoundedString(body[field], profileStringLimits[field]);
            if (value === null) return {error: `Invalid ${field}`};
            data[field] = value;
            continue;
        }

        if (["publicProfile", "allowMessages", "notifications"].includes(field)) {
            if (typeof body[field] !== "boolean") return {error: `Invalid ${field}`};
            data[field] = body[field];
            continue;
        }

        if (field === "age") {
            const age = Number(body.age);
            if (!Number.isInteger(age) || age < 13 || age > 120) return {error: "Invalid age"};
            data.age = age;
            continue;
        }

        if (field === "sex") {
            const sex = normalizeBoundedString(body.sex, {lowercase: true, max: 16});
            if (!["male", "female", "other"].includes(sex)) return {error: "Invalid sex"};
            data.sex = sex;
        }
    }

    if (data.login && !/^[a-zA-Z0-9._-]+$/.test(data.login)) {
        return {error: "Invalid login"};
    }
    if (data.email && !isValidEmail(data.email)) {
        return {error: "Invalid email"};
    }
    if (data.timezone) {
        try {
            new Intl.DateTimeFormat("en", {timeZone: data.timezone}).format();
        } catch {
            return {error: "Invalid timezone"};
        }
    }

    if (Object.prototype.hasOwnProperty.call(body, "favoriteTags")) {
        if (!Array.isArray(body.favoriteTags) || body.favoriteTags.length > 20) {
            return {error: "A maximum of 20 favorite tags is allowed"};
        }
        const tags = normalizeTags(body.favoriteTags);
        if (tags.some((tag) => tag.length > 40)) {
            return {error: "Tags must be 40 characters or fewer"};
        }
        data.favoriteTags = tags;
    }

    return {data};
};

export const getProfileCollections = async () => {
    const {client, db, usersCollection, sessionsCollection} = await getAuthCollections();

    return {
        client,
        db,
        usersCollection,
        sessionsCollection,
        tagsCollection: db.collection("tag"),
    };
};

export const getCurrentUser = async (request, required = true) => {
    const auth = required ? await requireUser(request) : await getOptionalUser(request);
    if (auth.error) {
        return {error: auth.error};
    }
    if (!auth.user) {
        return {user: null};
    }

    return {user: auth.user, userId: auth.userId};
};

const baseUser = (user) => {
    const id = String(user?._id || user?.id || "");

    return {
        id,
        _id: id,
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
        name: [user?.firstname, user?.lastname].filter(Boolean).join(" ")
            || user?.login
            || "Unnamed user",
        login: user?.login || "",
        profilePicture: user?.profilePicture || "",
        favoriteTags: normalizeTags(user?.favoriteTags || []),
        createdAt: user?.createdAt || null,
    };
};

export const serializePublicUser = (user) => baseUser(user);

export const serializeSelfUser = (user) => ({
    ...baseUser(user),
    email: user?.email || "",
    age: user?.age ?? "",
    sex: user?.sex || "",
    address: user?.address || "",
    country: user?.country || "",
    city: user?.city || "",
    status: user?.status || "Active",
    role: user?.role || "user",
    timezone: user?.timezone || "Asia/Yerevan",
    publicProfile: user?.publicProfile ?? true,
    notifications: user?.notifications ?? true,
    allowMessages: user?.allowMessages ?? true,
    connections: (user?.connections || []).map((connectionId) => String(connectionId)),
});

export const serializeAdminUser = (user) => serializeSelfUser(user);

// Kept for self-profile callers while routes transition to explicit DTOs.
export const serializeProfileUser = (user) => serializeSelfUser(user);

export const serializeTag = (tag) => ({
    id: String(tag?._id || ""),
    name: tag?.name || "",
    usage: Number(tag?.usage || 0),
});

export const updateTagUsage = async (tagsCollection, previousTags, nextTags, {session} = {}) => {
    const previousSet = new Set(normalizeTags(previousTags));
    const nextSet = new Set(normalizeTags(nextTags));
    const addedTags = [...nextSet].filter((tag) => !previousSet.has(tag));    const removedTags = [...previousSet].filter((tag) => !nextSet.has(tag));
    const operations = [
        ...addedTags.map((name) => ({
            updateOne: {
                filter: {name},
                update: {
                    $setOnInsert: {name, createdAt: new Date()},
                    $inc: {usage: 1},
                },
                upsert: true,
            },
        })),
        ...removedTags.map((name) => ({
            updateOne: {
                filter: {name},
                update: {$inc: {usage: -1}},
            },
        })),
    ];

    if (operations.length) {
        await tagsCollection.bulkWrite(operations, {session});
        await tagsCollection.updateMany({usage: {$lt: 0}}, {$set: {usage: 0}}, {session});
    }
};