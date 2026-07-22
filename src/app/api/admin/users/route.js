import {logger} from "@/server/observability/logger";
import {withApiObservability} from "@/server/http/api-handler";import {ObjectId} from "mongodb";import {hash} from "bcryptjs";
import {getUsersCollection, requireAdmin, serializeUser} from "./_shared";
import {validateProfileUpdate} from "@/app/api/profile/_shared";
import {normalizeBoundedString} from "@/server/http/request-validation";

async function GETHandler(request) {
    try {        const auth = await requireAdmin(request);
        if (auth.error) {
            return auth.error;
        }

        const {searchParams} = new URL(request.url);
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
        const skip = Math.min(Math.max(Number(searchParams.get("skip")) || 0, 0), 10000);
        const search = String(searchParams.get("search") || "").trim().slice(0, 160);
        const filter = search ? {$text: {$search: search}} : {};

        const usersCollection = await getUsersCollection();
        const total = await usersCollection.countDocuments(filter);
        const users = await usersCollection
            .find(filter, {projection: {password: 0}})
            .sort(search ? {score: {$meta: "textScore"}} : {createdAt: -1, _id: -1})
            .skip(skip)
            .limit(limit)
            .toArray();

        return Response.json({
            users: users.map(serializeUser),
            total,
            nextSkip: skip + users.length,
            hasMore: skip + users.length < total
        }, {status: 200});
    } catch (error) {
        logger.error("api.handler.error", {message: "Error loading admin users:", error: error});
        return Response.json({error: "Failed to load users"}, {status: 500});    }
}

async function PATCHHandler(request) {
    try {        const auth = await requireAdmin(request);
        if (auth.error) {
            return auth.error;
        }

        const body = await request.json();
        const {id, password, ...userData} = body;

        if (!id || !ObjectId.isValid(id)) {
            return Response.json({error: "Invalid user id"}, {status: 400});        }

        const usersCollection = await getUsersCollection();
        const userId = new ObjectId(id);
        const passwordWillChange = Boolean(password);
        const validated = validateProfileUpdate(userData);
        if (validated.error) {            return Response.json({error: validated.error}, {status: 400});
        }
        const updateData = validated.data;
        if (Object.prototype.hasOwnProperty.call(userData, "status")) {
            if (!["Active", "Suspended", "Pending"].includes(userData.status)) {
                return Response.json({error: "Invalid status"}, {status: 400});
            }
            updateData.status = userData.status;
        }
        if (Object.prototype.hasOwnProperty.call(userData, "profilePicture")) {
            const profilePicture = normalizeBoundedString(userData.profilePicture, {max: 500});
            if (profilePicture === null) {
                return Response.json({error: "Invalid profile picture path"}, {status: 400});
            }
            updateData.profilePicture = profilePicture;
        }

        if (updateData.login) {
            const existingLogin = await usersCollection.findOne({                _id: {$ne: userId},
                login: updateData.login
            });

            if (existingLogin) {
                return Response.json({error: "Login already exists"}, {status: 409});
            }
        }

        if (updateData.email) {
            const existingEmail = await usersCollection.findOne({
                _id: {$ne: userId},
                email: updateData.email
            });

            if (existingEmail) {
                return Response.json({error: "Email already exists"}, {status: 409});
            }
        }

        if (password) {
            if (typeof password !== "string" || password.length < 8 || password.length > 128) {
                return Response.json({error: "Password must be between 8 and 128 characters"}, {status: 400});
            }

            updateData.password = await hash(password, 12);
        }

        if (!Object.keys(updateData).length) {            return Response.json({error: "No changes provided"}, {status: 400});
        }

        const result = await usersCollection.findOneAndUpdate(
            {_id: userId},
            {$set: updateData},
            {returnDocument: "after", projection: {password: 0}}
        );

        const updatedUser = result?.value || result;

        if (updatedUser && passwordWillChange) {
            await auth.sessionsCollection.updateMany(
                {userId, revokedAt: null},
                {$set: {revokedAt: new Date()}},
            );
        }

        if (!updatedUser) {
            return Response.json({error: "User not found"}, {status: 404});        }

        return Response.json({user: serializeUser(updatedUser)}, {status: 200});
    } catch (error) {
        if (error?.code === 11000) {
            return Response.json({error: "Login or email already exists"}, {status: 409});
        }
        logger.error("api.handler.error", {message: "Error updating admin user:", error: error});
        return Response.json({error: "Failed to update user"}, {status: 500});    }}

export const GET = withApiObservability(GETHandler, {route: "/api/admin/users", method: "GET"});
export const PATCH = withApiObservability(PATCHHandler, {route: "/api/admin/users", method: "PATCH"});