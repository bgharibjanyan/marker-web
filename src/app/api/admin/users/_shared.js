import clientPromise from "@/app/lib/mongodb";
import {requireAdmin} from "@/app/api/admin/_shared";
import {serializeAdminUser} from "@/app/api/profile/_shared";

export {requireAdmin};

export const editableFields = [
    "firstname",    "lastname",
    "login",
    "email",
    "age",
    "sex",
    "address",
    "country",
    "city",
    "profilePicture",
    "status",
    "timezone",
    "publicProfile",
    "notifications",
    "allowMessages"
];

export const serializeUser = serializeAdminUser;

export const getUsersCollection = async () => {
    const client = await clientPromise;    return client.db("marker").collection("user");
};
