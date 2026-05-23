import clientPromise from "@/app/lib/mongodb";
import {ObjectId} from "mongodb";

export const profileEditableFields = [
    "firstname",
    "lastname",
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

export const getProfileCollections = async () => {
    const client = await clientPromise;
    const db = client.db("marker");

    return {
        db,
        usersCollection: db.collection("user"),
        sessionsCollection: db.collection("session"),
        tagsCollection: db.collection("tag"),
    };
};

export const getCurrentUser = async (request, required = true) => {
    const token = request.headers.get("authorization");

    if (!token) {
        return required ? {error: Response.json({error: "Unauthorized"}, {status: 401})} : {user: null};
    }

    const {usersCollection, sessionsCollection} = await getProfileCollections();
    const session = await sessionsCollection.findOne({token});
    const userId = toObjectId(session?.userId);

    if (!userId) {
        return required ? {error: Response.json({error: "Unauthorized"}, {status: 401})} : {user: null};
    }

    const user = await usersCollection.findOne(
        {_id: userId},
        {projection: {password: 0}}
    );

    if (!user) {
        return required ? {error: Response.json({error: "User not found"}, {status: 404})} : {user: null};
    }

    return {user, userId};
};

export const serializeProfileUser = (user) => {
    const id = String(user?._id || user?.id || "");

    return {
        id,
        _id: id,
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
        name: [user?.firstname, user?.lastname].filter(Boolean).join(" ") || user?.login || user?.email || "Unnamed user",
        login: user?.login || "",
        email: user?.email || "",
        age: user?.age ?? "",
        sex: user?.sex || "",
        address: user?.address || "",
        country: user?.country || "",
        city: user?.city || "",
        profilePicture: user?.profilePicture || "",
        status: user?.status || "Active",
        timezone: user?.timezone || "Asia/Yerevan",
        publicProfile: user?.publicProfile ?? true,
        notifications: user?.notifications ?? true,
        allowMessages: user?.allowMessages ?? true,
        favoriteTags: normalizeTags(user?.favoriteTags || []),
        connections: (user?.connections || []).map((connectionId) => String(connectionId)),
        createdAt: user?.createdAt || null,
    };
};

export const serializeTag = (tag) => ({
    id: String(tag?._id || ""),
    name: tag?.name || "",
    usage: Number(tag?.usage || 0),
});

export const updateTagUsage = async (tagsCollection, previousTags, nextTags) => {
    const previousSet = new Set(normalizeTags(previousTags));
    const nextSet = new Set(normalizeTags(nextTags));
    const addedTags = [...nextSet].filter((tag) => !previousSet.has(tag));
    const removedTags = [...previousSet].filter((tag) => !nextSet.has(tag));
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
        await tagsCollection.bulkWrite(operations);
        await tagsCollection.updateMany({usage: {$lt: 0}}, {$set: {usage: 0}});
    }
};
