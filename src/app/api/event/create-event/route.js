import clientPromise from "@/app/lib/mongodb";
import EventModel from "@/models/event/EventModel";
import {console} from "next/dist/compiled/@edge-runtime/primitives";

export async function POST(request) {
    try {
        const client = await clientPromise;


        let authToken = request.headers.get('authorization');

        const db = client.db("marker");

        const usersCollection = db.collection("user");

        const sessionsCollection = db.collection("session");

        const session = await sessionsCollection.findOne({token: authToken})

        if (!session.userId) {
            return Response.json({error: "Unnauthorized"}, {status: 401});
        }

        const user = await usersCollection.findOne({_id: session.userId})

        const eventsCollection = db.collection("events");

        const body = await request.json();


        let eventData = new EventModel(body)


        eventData.setUser(user._id)

        eventsCollection.insertOne(eventData)


        return Response.json({error: "Event Added Successfully"}, {status: 200});
    } catch (error) {
        console.log(error);
        return Response.json({error: "Failed to fetch events"}, {status: 500});
    }
}
