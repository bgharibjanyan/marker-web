import {ObjectId} from "mongodb";
import {mkdir, unlink, writeFile} from "fs/promises";
import path from "path";
import {getUsersCollection, isAdminRequest, serializeUser} from "../_shared";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const uploadDirectory = path.join(process.cwd(), "public", "uploads", "profiles");
const allowedImageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
};

const removeOldProfileImages = async (userId, nextExtension) => {
    const extensions = [...new Set(Object.values(allowedImageTypes))];

    await Promise.allSettled(
        extensions
            .filter((extension) => extension !== nextExtension)
            .map((extension) => unlink(path.join(uploadDirectory, `${userId}.${extension}`)))
    );
};

export async function POST(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const formData = await request.formData();
        const id = String(formData.get("id") || "");
        const image = formData.get("image");

        if (!id || !ObjectId.isValid(id)) {
            return Response.json({error: "Invalid user id"}, {status: 400});
        }

        if (!image || typeof image.arrayBuffer !== "function") {
            return Response.json({error: "Image file is required"}, {status: 400});
        }

        const extension = allowedImageTypes[image.type];

        if (!extension) {
            return Response.json({error: "Only JPG, PNG, WEBP, and GIF images are allowed"}, {status: 400});
        }

        if (image.size > MAX_IMAGE_SIZE) {
            return Response.json({error: "Image must be smaller than 5MB"}, {status: 400});
        }

        const usersCollection = await getUsersCollection();
        const userId = new ObjectId(id);
        const existingUser = await usersCollection.findOne({_id: userId}, {projection: {_id: 1}});

        if (!existingUser) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        await mkdir(uploadDirectory, {recursive: true});
        await removeOldProfileImages(id, extension);

        const fileName = `${id}.${extension}`;
        const publicImagePath = `/uploads/profiles/${fileName}`;
        const imageBuffer = Buffer.from(await image.arrayBuffer());

        await writeFile(path.join(uploadDirectory, fileName), imageBuffer);

        const result = await usersCollection.findOneAndUpdate(
            {_id: userId},
            {$set: {profilePicture: publicImagePath}},
            {returnDocument: "after", projection: {password: 0}}
        );

        const updatedUser = result?.value || result;

        return Response.json({user: serializeUser(updatedUser)}, {status: 200});
    } catch (error) {
        console.error("Error uploading admin profile image:", error);
        return Response.json({error: "Failed to upload profile image"}, {status: 500});
    }
}
