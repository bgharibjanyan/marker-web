import clientPromise from "@/app/lib/mongodb";
import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../../models/user/User";
import Session from "../../../../models/session/Session";

const SECRET_KEY = process.env.JWT_SECRET || "gagooooooo";

export async function POST(request) {
    try {
        const client = await clientPromise;
        const usersCollection = client.db("marker").collection("user");

        const body = await request.json();
        const { firstname, login,email, password, age, sex, lastname, address, profilePicture } = body;

        if (!firstname || !login || !password || !age || !sex) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existingUser = await usersCollection.findOne({ login });
        if (existingUser) {
            return Response.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await hash(password, 10);

        // Set default profile picture based on sex if none provided
        const defaultProfilePicture = profilePicture || `/uploads/profiles/default/${sex === 'male' ? 'male.png' : 'female.png'}`;

        const newUser = new User({
            firstname,
            login,
            email,
            password: hashedPassword,
            age,
            sex,
            lastname,
            address,
            profilePicture: defaultProfilePicture,
        });

        const result = await usersCollection.insertOne(newUser);

        // Create a session and token for automatic login after registration
        const sessionsCollection = client.db("marker").collection("session");
        const token = jwt.sign(
            { userId: result.insertedId, login: newUser.login },
            SECRET_KEY,
            { expiresIn: "7d" }
        );
        const newSession = new Session({ userId: result.insertedId });
        newSession.token = token;
        const sessionResult = await sessionsCollection.insertOne(newSession);

        return Response.json(
            { 
                message: "User registered successfully", 
                userId: result.insertedId,
                token,
                sessionId: sessionResult.insertedId 
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error registering user:", error);
        return Response.json({ error: "Failed to register user" }, { status: 500 });
    }
}
