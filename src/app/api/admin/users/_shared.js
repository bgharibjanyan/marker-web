import clientPromise from "@/app/lib/mongodb";
import {ADMIN_AUTH_HEADER, ADMIN_AUTH_VALUE, isAdminRequest} from "@/app/api/admin/_shared";

export {ADMIN_AUTH_HEADER, ADMIN_AUTH_VALUE, isAdminRequest};

export const editableFields = [
    "firstname",
    "lastname",
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

export const serializeUser = (user) => ({
    id: user._id.toString(),
    firstname: user.firstname || "",
    lastname: user.lastname || "",
    name: [user.firstname, user.lastname].filter(Boolean).join(" ") || user.login || user.email || "Unnamed user",
    login: user.login || "",
    email: user.email || "",
    age: user.age ?? "",
    sex: user.sex || "",
    address: user.address || "",
    country: user.country || "",
    city: user.city || "",
    profilePicture: user.profilePicture || "",
    status: user.status || "Active",
    timezone: user.timezone || "Asia/Yerevan",
    publicProfile: user.publicProfile ?? true,
    notifications: user.notifications ?? true,
    allowMessages: user.allowMessages ?? true,
    createdAt: user.createdAt || null
});

export const getUsersCollection = async () => {
    const client = await clientPromise;
    return client.db("marker").collection("user");
};
