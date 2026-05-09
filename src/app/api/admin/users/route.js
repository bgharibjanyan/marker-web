import {ObjectId} from "mongodb";
import {hash} from "bcryptjs";
import {editableFields, getUsersCollection, isAdminRequest, serializeUser} from "./_shared";

export async function GET(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const {searchParams} = new URL(request.url);
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 50);
        const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);
        const search = (searchParams.get("search") || "").trim();
        const filter = search
            ? {
                $or: [
                    {firstname: {$regex: search, $options: "i"}},
                    {lastname: {$regex: search, $options: "i"}},
                    {login: {$regex: search, $options: "i"}},
                    {email: {$regex: search, $options: "i"}},
                    {country: {$regex: search, $options: "i"}},
                    {city: {$regex: search, $options: "i"}}
                ]
            }
            : {};

        const usersCollection = await getUsersCollection();
        const total = await usersCollection.countDocuments(filter);
        const users = await usersCollection
            .find(filter, {projection: {password: 0}})
            .sort({createdAt: -1})
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
        console.error("Error loading admin users:", error);
        return Response.json({error: "Failed to load users"}, {status: 500});
    }
}

export async function PATCH(request) {
    try {
        if (!isAdminRequest(request)) {
            return Response.json({error: "Unauthorized"}, {status: 401});
        }

        const body = await request.json();
        const {id, password, ...userData} = body;

        if (!id || !ObjectId.isValid(id)) {
            return Response.json({error: "Invalid user id"}, {status: 400});
        }

        const usersCollection = await getUsersCollection();
        const userId = new ObjectId(id);
        const updateData = {};

        editableFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(userData, field)) {
                updateData[field] = userData[field];
            }
        });

        if (updateData.login) {
            const existingLogin = await usersCollection.findOne({
                _id: {$ne: userId},
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
            if (String(password).length < 6) {
                return Response.json({error: "Password must be at least 6 characters"}, {status: 400});
            }

            updateData.password = await hash(password, 10);
        }

        if (!Object.keys(updateData).length) {
            return Response.json({error: "No changes provided"}, {status: 400});
        }

        const result = await usersCollection.findOneAndUpdate(
            {_id: userId},
            {$set: updateData},
            {returnDocument: "after", projection: {password: 0}}
        );

        const updatedUser = result?.value || result;

        if (!updatedUser) {
            return Response.json({error: "User not found"}, {status: 404});
        }

        return Response.json({user: serializeUser(updatedUser)}, {status: 200});
    } catch (error) {
        console.error("Error updating admin user:", error);
        return Response.json({error: "Failed to update user"}, {status: 500});
    }
}
