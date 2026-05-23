import clientPromise from "@/app/lib/mongodb";
import {ObjectId} from "mongodb";
import {mkdir, rm, writeFile} from "fs/promises";
import path from "path";

export const MAX_POST_IMAGES = 4;
export const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024;

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "posts");
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

export const getAuthenticatedPostContext = async (request) => {
    const token = request.headers.get("authorization");

    if (!token) {
        return {error: Response.json({error: "Unauthorized"}, {status: 401})};
    }

    const client = await clientPromise;
    const db = client.db("marker");
    const sessionsCollection = db.collection("session");
    const usersCollection = db.collection("user");
    const session = await sessionsCollection.findOne({token});
    const userId = toObjectId(session?.userId);

    if (!userId) {
        return {error: Response.json({error: "Unauthorized"}, {status: 401})};
    }

    const user = await usersCollection.findOne(
        {_id: userId},
        {projection: {password: 0}}
    );

    if (!user) {
        return {error: Response.json({error: "User not found"}, {status: 404})};
    }

    return {
        db,
        user,
        userId,
        usersCollection,
        postsCollection: db.collection("posts"),
        tasksCollection: db.collection("tasks"),
    };
};

export const getPostMediaFiles = (formData) => (
    formData
        .getAll("media")
        .filter((file) => file && typeof file.arrayBuffer === "function" && file.size > 0)
);

export const validatePostInput = ({taskId, title, mediaFiles = []}) => {
    if (!taskId) {
        return "Task id is required.";
    }

    if (!String(title || "").trim()) {
        return "Post title is required.";
    }

    if (mediaFiles.length > MAX_POST_IMAGES) {
        return `Posts can include up to ${MAX_POST_IMAGES} images.`;
    }

    for (const file of mediaFiles) {
        if (!allowedImageTypes[file.type]) {
            return "Only JPG, PNG, WEBP, and GIF images are allowed.";
        }

        if (file.size > MAX_POST_IMAGE_SIZE) {
            return "Each image must be smaller than 5MB.";
        }
    }

    return "";
};

export const getOwnedTask = async (tasksCollection, taskId, userId) => {
    if (!taskId) return null;

    return tasksCollection.findOne({_id: taskId, userId});
};

export const savePostMedia = async (postId, mediaFiles = []) => {
    if (!mediaFiles.length) {
        return [];
    }

    const postIdString = String(postId);
    const postDirectory = path.join(uploadDirectory, postIdString);
    const publicPaths = [];

    await mkdir(postDirectory, {recursive: true});

    try {
        for (let index = 0; index < mediaFiles.length; index += 1) {
            const file = mediaFiles[index];
            const extension = allowedImageTypes[file.type];
            const fileName = `${index + 1}.${extension}`;
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            await writeFile(path.join(postDirectory, fileName), fileBuffer);
            publicPaths.push(`/uploads/posts/${postIdString}/${fileName}`);
        }
    } catch (error) {
        await rm(postDirectory, {recursive: true, force: true});
        throw error;
    }

    return publicPaths;
};

export const removePostMedia = async (postId) => {
    if (!postId) return;

    await rm(path.join(uploadDirectory, String(postId)), {
        recursive: true,
        force: true,
    });
};

export const serializePost = (post) => ({
    _id: String(post?._id || ""),
    task: String(post?.task || ""),
    title: post?.title || "",
    description: post?.description || "",
    media: Array.isArray(post?.media) ? post.media : [],
    userId: String(post?.userId || ""),
    createdAt: post?.createdAt instanceof Date ? post.createdAt.toISOString() : post?.createdAt || null,
    updatedAt: post?.updatedAt instanceof Date ? post.updatedAt.toISOString() : post?.updatedAt || null,
});
