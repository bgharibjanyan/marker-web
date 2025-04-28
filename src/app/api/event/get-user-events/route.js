import clientPromise from "@/app/lib/mongodb";
import {NextResponse} from 'next/server';

export async function GET(request) {
    try {
        const {searchParams} = new URL(request.url);
        const userId = searchParams.get('userId');
        const authToken = request.headers.get('authorization');

        const client = await clientPromise;
        const db = client.db("marker");

        const sessionsCollection = db.collection("session");
        const eventsCollection = db.collection("events");

        const session = await sessionsCollection.findOne({token: authToken});

        if (!session || !session.userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const memberId = session.userId;

        let events;

        if (userId) {
            events = await eventsCollection.find({userId: userId, isPrivate:false}).toArray();
        } else {
            events = await eventsCollection.find({userId: memberId}).toArray();
        }

        const serializedEvents = events.map(event => ({
            ...event,
            _id: event._id.toString(),
        }));

        return NextResponse.json(serializedEvents);

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to fetch events"}, {status: 500});
    }
}
