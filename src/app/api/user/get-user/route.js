import clientPromise from "@/app/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db("marker");
        const usersCollection = db.collection("user");
        const sessionsCollection = db.collection("session");

        const token = request.headers.get("authorization");
        if (!token) {
            return NextResponse.json(
                { error: "Missing imtoken in headers" },
                { status: 401 }
            );
        }

        const session = await sessionsCollection.findOne({ token });

        if (!session) {
            return NextResponse.json(
                { error: "Invalid or expired session" },
                { status: 401 }
            );
        }

        const userId = session.userId;

        if (!userId) {
            return NextResponse.json(
                { error: "Session is missing userId" },
                { status: 401 }
            );
        }

        const user = await usersCollection.findOne(
            { _id: userId },
            { projection: { password: 0 } }
        );

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /auth/me:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}