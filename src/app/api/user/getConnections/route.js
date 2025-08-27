import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import User from "../../../../models/user/User";

function isValidObjectId(id) {
    return /^[a-fA-F0-9]{24}$/.test(id);
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        console.log("searchParams")

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid or missing user id" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const usersCollection = db.collection("users");

        const userData = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = new User(userData);

        const connectionIds = (user.connections || [])
            .filter((c) => isValidObjectId(c))
            .map((c) => new ObjectId(c));

        let connections = [];
        if (connectionIds.length > 0) {
            const connectedDocs = await usersCollection
                .find({ _id: { $in: connectionIds } })
                .toArray();

            connections = connectedDocs.map((doc) => new User(doc));
        }

        return NextResponse.json({
            user,
            connections,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }
}