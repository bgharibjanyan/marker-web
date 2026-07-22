import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {    getCurrentUser,
    getProfileCollections,
    validateProfileUpdate,
    serializeProfileUser,
    updateTagUsage,
} from "@/app/api/profile/_shared";
import {withMongoTransaction} from "@/server/database/with-mongo-transaction";

async function PATCHHandler(request) {
    try {        const current = await getCurrentUser(request);

        if (current.error) {
            return current.error;
        }

        const {client, usersCollection, tagsCollection} = await getProfileCollections();
        const body = await request.json();
        const validated = validateProfileUpdate(body);
        if (validated.error) {
            return Response.json({error: validated.error}, {status: 400});
        }
        const updateData = validated.data;

        if (updateData.login) {
            const existingLogin = await usersCollection.findOne(
                {_id: {$ne: current.userId}, login: updateData.login},
                {collation: {locale: "en", strength: 2}},
            );

            if (existingLogin) {
                return Response.json({error: "Login already exists"}, {status: 409});            }
        }

        if (updateData.email) {
            const existingEmail = await usersCollection.findOne(
                {_id: {$ne: current.userId}, email: updateData.email},
                {collation: {locale: "en", strength: 2}},
            );

            if (existingEmail) {
                return Response.json({error: "Email already exists"}, {status: 409});            }
        }

        if (!Object.keys(updateData).length) {
            return Response.json({error: "No changes provided"}, {status: 400});
        }

        const updatedUser = await withMongoTransaction(client, async (session) => {
            if (Object.prototype.hasOwnProperty.call(updateData, "favoriteTags")) {
                await updateTagUsage(
                    tagsCollection,
                    current.user.favoriteTags || [],
                    updateData.favoriteTags,
                    {session},
                );
            }

            const result = await usersCollection.findOneAndUpdate(
                {_id: current.userId},
                {$set: updateData},
                {returnDocument: "after", projection: {password: 0}, session},
            );
            return result?.value || result;
        });

        if (!updatedUser) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        return Response.json({user: serializeProfileUser(updatedUser)}, {status: 200});
    } catch (error) {
        if (error?.code === 11000) {
            return Response.json({error: "Login or email already exists"}, {status: 409});
        }
        logger.error("api.handler.error", {message: "Error in PATCH /profile/update-profile:", error: error});
        return Response.json({error: "Failed to update profile"}, {status: 500});    }
}

export const PATCH = withApiObservability(PATCHHandler, {route: "/api/profile/update-profile", method: "PATCH"});