import {
    getCurrentUser,
    getProfileCollections,
    normalizeTags,
    profileEditableFields,
    serializeProfileUser,
    updateTagUsage,
} from "@/app/api/profile/_shared";

export async function PATCH(request) {
    try {
        const current = await getCurrentUser(request);

        if (current.error) {
            return current.error;
        }

        const {usersCollection, tagsCollection} = await getProfileCollections();
        const body = await request.json();
        const updateData = {};

        profileEditableFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(body, field)) {
                updateData[field] = body[field];
            }
        });

        if (Object.prototype.hasOwnProperty.call(body, "favoriteTags")) {
            updateData.favoriteTags = normalizeTags(body.favoriteTags);
        }

        if (updateData.login) {
            const existingLogin = await usersCollection.findOne({
                _id: {$ne: current.userId},
                login: updateData.login,
            });

            if (existingLogin) {
                return Response.json({error: "Login already exists"}, {status: 409});
            }
        }

        if (updateData.email) {
            const existingEmail = await usersCollection.findOne({
                _id: {$ne: current.userId},
                email: updateData.email,
            });

            if (existingEmail) {
                return Response.json({error: "Email already exists"}, {status: 409});
            }
        }

        if (!Object.keys(updateData).length) {
            return Response.json({error: "No changes provided"}, {status: 400});
        }

        if (Object.prototype.hasOwnProperty.call(updateData, "favoriteTags")) {
            await updateTagUsage(tagsCollection, current.user.favoriteTags || [], updateData.favoriteTags);
        }

        const result = await usersCollection.findOneAndUpdate(
            {_id: current.userId},
            {$set: updateData},
            {returnDocument: "after", projection: {password: 0}}
        );
        const updatedUser = result?.value || result;

        if (!updatedUser) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        return Response.json({user: serializeProfileUser(updatedUser)}, {status: 200});
    } catch (error) {
        console.error("Error in PATCH /profile/update-profile:", error);
        return Response.json({error: "Failed to update profile"}, {status: 500});
    }
}
