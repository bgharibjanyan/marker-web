import clientPromise from "@/app/lib/mongodb";
import {compare} from "bcryptjs";
import jwt from "jsonwebtoken";
import Session from "../../../../models/session/Session";

const SECRET_KEY = process.env.JWT_SECRET || "gagooooooo";

const validateRequestBody = ({login, password}) => {
    if (!login || !password) {
        return {isValid: false, error: "Missing required fields"};
    }
    return {isValid: true};
};

const createToken = (user) => {
    return jwt.sign(
        {userId: user._id, login: user.login},
        SECRET_KEY,
        {expiresIn: "7d"}
    );
};

const createSession = async (sessionsCollection, userId, token) => {
    const newSession = new Session({userId});
    newSession.token = token;
    return await sessionsCollection.insertOne(newSession);
};

const authenticateUser = async (usersCollection, login, password) => {
    const user = await usersCollection.findOne({login: login});

    if (!user) {
        return {isAuthenticated: false, error: "No user Found"};
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
        return {isAuthenticated: false, error: "Invalid login or password"};
    }

    return {isAuthenticated: true, user};
};

export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db("marker");
        const usersCollection = db.collection("user");
        const sessionsCollection = db.collection("session");

        const body = await request.json();
        const {login, password} = body;

        const validation = validateRequestBody({login, password});
        if (!validation.isValid) {
            return Response.json({error: validation.error}, {status: 400});
        }

        const authResult = await authenticateUser(usersCollection, login, password);
        if (!authResult.isAuthenticated) {
            return Response.json({error: authResult.error}, {status: 400});
        }

        const token = createToken(authResult.user);

        const sessionResult = await createSession(sessionsCollection, authResult.user._id, token);

        return Response.json(
            {
                message: "Login successful",
                token,
                sessionId: sessionResult.insertedId
            },
            {status: 200}
        );
    } catch (error) {
        console.error("Error logging in:", error);
        return Response.json({error: "Failed to login"}, {status: 500});
    }
}
