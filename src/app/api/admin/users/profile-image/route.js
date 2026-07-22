import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {ObjectId} from "mongodb";import {requireAdmin, serializeUser} from "../_shared";
import {multipartRequestLimit, UploadValidationError} from "@/server/uploads/image-validation";
import {removeProfileImage, storeProfileImage} from "@/server/uploads/profile-image-storage";
import {rejectOversizedRequest} from "@/server/http/request-validation";

export const runtime = "nodejs";

async function POSTHandler(request) {
    let storedImage = null;
    try {
        const auth = await requireAdmin(request);
        if (auth.error) return auth.error;

        const sizeError = rejectOversizedRequest(request, multipartRequestLimit(1, 5 * 1024 * 1024));
        if (sizeError) return sizeError;

        const formData = await request.formData();
        const id = String(formData.get("id") || "");
        if (!ObjectId.isValid(id)) {
            return Response.json({error: "Invalid user id"}, {status: 400});
        }

        const userId = new ObjectId(id);
        const existingUser = await auth.usersCollection.findOne({_id: userId});
        if (!existingUser) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        storedImage = await storeProfileImage(formData.get("image"), id);
        const result = await auth.usersCollection.findOneAndUpdate(
            {_id: userId},
            {$set: {profilePicture: storedImage.publicPath}},
            {returnDocument: "after", projection: {password: 0}},
        );
        const updatedUser = result?.value || result;
        if (!updatedUser) {
            await removeProfileImage(storedImage.publicPath);
            return Response.json({error: "User not found"}, {status: 404});
        }

        await removeProfileImage(existingUser.profilePicture);
        return Response.json({user: serializeUser(updatedUser)}, {status: 200});
    } catch (error) {
        if (storedImage) await removeProfileImage(storedImage.publicPath).catch(() => {});
        if (error instanceof UploadValidationError) {
            return Response.json({error: error.message}, {status: error.status});
        }
        logger.error("api.handler.error", {message: "Error uploading admin profile image:", error: error});
        return Response.json({error: "Failed to upload profile image"}, {status: 500});    }}

export const POST = withApiObservability(POSTHandler, {route: "/api/admin/users/profile-image", method: "POST"});