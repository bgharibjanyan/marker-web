import clientPromise from "@/app/lib/mongodb";
import {NextResponse} from "next/server";
import {ObjectId} from "mongodb";

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
        const followedUserId = String(body?.userId || "").trim();

        if (!ObjectId.isValid(followedUserId)) {
            return NextResponse.json(
                {error: "Missing or invalid userId"},
                {status: 400}
            );
        }

        if (String(session.userId) === followedUserId) {
            return NextResponse.json(
                {error: "You cannot follow yourself"},
                {status: 400}
            );
        }

        const followedObjectId = new ObjectId(followedUserId);
        const followedUser = await usersCollection.findOne(
            {_id: followedObjectId},
            {projection: {password: 0}}
        );

        if (!followedUser) {
            return NextResponse.json(
                {error: "User not found"},
                {status: 404}
            );
        }

        await usersCollection.updateOne(
            {_id: session.userId},
            {$addToSet: {connections: followedObjectId}}
        );

        const user = await usersCollection.findOne(
            {_id: session.userId},
            {projection: {password: 0}}
        );

        return NextResponse.json({user, followedUser}, {status: 200});
    } catch (error) {
        console.error("Error in POST /user/follow-user:", error);
        return NextResponse.json(
            {error: "Failed to follow user"},
            {status: 500}
        );
    }
}
