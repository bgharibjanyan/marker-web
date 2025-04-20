import clientPromise from "../../../lib/mongodb";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import Session from "../../../../models/session/Session";

const SECRET_KEY = process.env.JWT_SECRET || "gagooooooo";

export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db("marker");
        const usersCollection = db.collection("user");
        const sessionsCollection = db.collection("session");

        const body = await request.json();
        const { login, password } = body;

        if (!login || !password) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await usersCollection.findOne({ login: login.toLowerCase() });

        if (!user) {
            return Response.json({ error: "Invalid login or password" }, { status: 400 });
        }

        const isMatch = await compare(password, user.password);
        if (!isMatch) {
            return Response.json({ error: "Invalid login or password" }, { status: 400 });
        }

        const token = jwt.sign({ userId: user._id, login: user.login }, SECRET_KEY, {
            expiresIn: "7d",
        });

        const newSession = new Session({
            userId: user._id,
        });
        newSession.token = token;

        const result = await sessionsCollection.insertOne(newSession);

        return Response.json(
            { message: "Login successful", token, sessionId: result.insertedId },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error logging in:", error);
        return Response.json({ error: "Failed to login" }, { status: 500 });
    }
}
