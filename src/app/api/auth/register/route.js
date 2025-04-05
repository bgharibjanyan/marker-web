import clientPromise from "../../../lib/mongodb";
import { hash } from "bcryptjs";
import User from "../../../../models/user/User";

export async function POST(request) {
    try {
        const client = await clientPromise;
        const usersCollection = client.db("marker").collection("user");

        const body = await request.json();
        const { firstname, login,email, password, age, sex, lastname, address } = body;
        console.log([firstname, login,email, password, age, sex, lastname, address])

        console.log(body);

        if (!firstname || !login || !password || !age || !sex) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }

        const existingUser = await usersCollection.findOne({ login });
        if (existingUser) {
            return Response.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await hash(password, 10);

        const newUser = new User({
            firstname,
            login,
            email,
            password: hashedPassword,
            age,
            sex,
            lastname,
            address,
        });

        const result = await usersCollection.insertOne(newUser);

        return Response.json(
            { message: "User registered successfully", userId: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error registering user:", error);
        return Response.json({ error: "Failed to register user" }, { status: 500 });
    }
}
