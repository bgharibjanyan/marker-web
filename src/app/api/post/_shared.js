import {requireUser} from "@/app/api/_auth/session";
import {ObjectId} from "mongodb";
import {mkdir, rm, writeFile} from "fs/promises";
import path from "path";
import {ALLOWED_IMAGE_TYPES, validateImageFile} from "@/server/uploads/image-validation";

export const MAX_POST_IMAGES = 4;
export const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024;

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "posts");
const allowedImageTypes = ALLOWED_IMAGE_TYPES;

export const toObjectId = (id) => {
    const stringId = String(id || "");    return ObjectId.isValid(stringId) ? new ObjectId(stringId) : null;
};

export const getAuthenticatedPostContext = async (request) => {
    const auth = await requireUser(request);
    if (auth.error) {
        return auth;
    }

    return {
        client: auth.client,
        db: auth.db,
        user: auth.user,
        userId: auth.userId,        usersCollection: auth.usersCollection,
        postsCollection: auth.db.collection("posts"),
        tasksCollection: auth.db.collection("tasks"),
    };
};

export const getPostMediaFiles = (formData) => (
    formData
        .getAll("media")
        .filter((file) => file && typeof file.arrayBuffer === "function" && file.size > 0)
);

export const validatePostInput = ({taskId, title, description, mediaFiles = []}) => {
    if (!taskId) {
        return "Task id is required.";
    }

    if (!String(title || "").trim()) {
        return "Post title is required.";
    }

    if (String(title).trim().length > 160) {
        return "Post title must be 160 characters or fewer.";
    }

    if (String(description || "").length > 20000) {
        return "Post description is too long.";
    }

    if (mediaFiles.length > MAX_POST_IMAGES) {        return `Posts can include up to ${MAX_POST_IMAGES} images.`;
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
            const {buffer, extension} = await validateImageFile(file, {maxBytes: MAX_POST_IMAGE_SIZE});
            const fileName = `${index + 1}.${extension}`;

            await writeFile(path.join(postDirectory, fileName), buffer);
            publicPaths.push(`/uploads/posts/${postIdString}/${fileName}`);
        }
    } catch (error) {        await rm(postDirectory, {recursive: true, force: true});
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
