import {mkdir, unlink, writeFile} from "fs/promises";
import path from "path";
import {getCurrentUser, getProfileCollections, serializeProfileUser} from "@/app/api/profile/_shared";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const uploadDirectory = path.join(process.cwd(), "public", "uploads", "profiles");
const allowedImageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
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
        const current = await getCurrentUser(request);

        if (current.error) {
            return current.error;
        }

        const formData = await request.formData();
        const image = formData.get("image");

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

        const {usersCollection} = await getProfileCollections();
        const userId = String(current.userId);

        await mkdir(uploadDirectory, {recursive: true});
        await removeOldProfileImages(userId, extension);

        const fileName = `${userId}.${extension}`;
        const publicImagePath = `/uploads/profiles/${fileName}`;
        const imageBuffer = Buffer.from(await image.arrayBuffer());

        await writeFile(path.join(uploadDirectory, fileName), imageBuffer);

        const result = await usersCollection.findOneAndUpdate(
            {_id: current.userId},
            {$set: {profilePicture: publicImagePath}},
            {returnDocument: "after", projection: {password: 0}}
        );
        const updatedUser = result?.value || result;

        return Response.json({user: serializeProfileUser(updatedUser)}, {status: 200});
    } catch (error) {
        console.error("Error in POST /profile/profile-image:", error);
        return Response.json({error: "Failed to upload profile image"}, {status: 500});
    }
}
