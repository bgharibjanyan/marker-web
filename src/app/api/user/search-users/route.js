import clientPromise from "@/app/lib/mongodb";
import {NextResponse} from "next/server";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db("marker");
        const usersCollection = db.collection("user");
        const sessionsCollection = db.collection("session");
        const token = request.headers.get("authorization");

        if (!token) {
            return NextResponse.json(
                {error: "Missing authorization token"},
                {status: 401}
            );
        }

        const session = await sessionsCollection.findOne({token});

        if (!session?.userId) {
            return NextResponse.json(
                {error: "Invalid or expired session"},
                {status: 401}
            );
        }

        const body = await request.json();
        const query = String(body?.query || "").trim();

        if (!query) {
            return NextResponse.json({users: []}, {status: 200});
        }

        const searchPattern = new RegExp(escapeRegex(query), "i");
        const users = await usersCollection.find(
            {
                _id: {$ne: session.userId},
                $or: [
                    {firstname: searchPattern},
                    {lastname: searchPattern},
                    {email: searchPattern},
                    {login: searchPattern},
                ],
            },
            {projection: {password: 0}}
        ).limit(25).toArray();

        return NextResponse.json({users}, {status: 200});
    } catch (error) {
        console.error("Error in POST /user/search-users:", error);
        return NextResponse.json(
            {error: "Failed to search users"},
            {status: 500}
        );
    }
}
