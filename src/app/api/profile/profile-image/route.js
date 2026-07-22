import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {getCurrentUser, getProfileCollections, serializeProfileUser} from "@/app/api/profile/_shared";import {multipartRequestLimit, UploadValidationError} from "@/server/uploads/image-validation";
import {removeProfileImage, storeProfileImage} from "@/server/uploads/profile-image-storage";
import {rejectOversizedRequest} from "@/server/http/request-validation";

export const runtime = "nodejs";

async function POSTHandler(request) {
    let storedImage = null;
    try {
        const current = await getCurrentUser(request);
        if (current.error) return current.error;

        const sizeError = rejectOversizedRequest(request, multipartRequestLimit(1, 5 * 1024 * 1024));
        if (sizeError) return sizeError;

        const image = (await request.formData()).get("image");
        storedImage = await storeProfileImage(image, current.userId);

        const {usersCollection} = await getProfileCollections();
        const result = await usersCollection.findOneAndUpdate(
            {_id: current.userId},
            {$set: {profilePicture: storedImage.publicPath}},
            {returnDocument: "after", projection: {password: 0}},
        );
        const updatedUser = result?.value || result;
        if (!updatedUser) {
            await removeProfileImage(storedImage.publicPath);
            return Response.json({error: "User not found"}, {status: 404});
        }

        await removeProfileImage(current.user.profilePicture);
        return Response.json({user: serializeProfileUser(updatedUser)}, {status: 200});
    } catch (error) {
        if (storedImage) await removeProfileImage(storedImage.publicPath).catch(() => {});
        if (error instanceof UploadValidationError) {
            return Response.json({error: error.message}, {status: error.status});
        }
        logger.error("api.handler.error", {message: "Error in POST /profile/profile-image:", error: error});
        return Response.json({error: "Failed to upload profile image"}, {status: 500});    }}

export const POST = withApiObservability(POSTHandler, {route: "/api/profile/profile-image", method: "POST"});