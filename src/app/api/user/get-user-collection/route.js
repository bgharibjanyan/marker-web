import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db("marker");
        const usersCollection = db.collection("user");

        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "Missing or invalid 'ids' array in body" },
                { status: 400 }
            );
        }

        const objectIds = ids.map(id => {
            try {
                return new ObjectId(id);
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        if (objectIds.length === 0) {
            return NextResponse.json(
                { error: "No valid user IDs provided" },
                { status: 400 }
            );
        }

        const users = await usersCollection.find(
            { _id: { $in: objectIds } },
            { projection: { password: 0 } }
        ).toArray();

        return NextResponse.json({ users }, { status: 200 });

    } catch (error) {
        console.error("Error in POST /users/by-ids:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
