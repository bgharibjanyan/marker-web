import jwt from "jsonwebtoken";
import clientPromise from "@/app/lib/mongodb";

const SECRET_KEY = process.env.JWT_SECRET || "gagooooooo";

export class AuthenticatedHandler {
    constructor(req) {
        this.req = req;
        this.user = null;
    }

    async authenticate() {
        const authHeader = this.req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("Unauthorized");
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, SECRET_KEY);

            const client = await clientPromise;
            const db = client.db("marker");
            const usersCollection = db.collection("user");

            const user = await usersCollection.findOne({ _id: decoded.userId });

            console.log(user);
            if (!user) {
                throw new Error("Unauthorized");
            }
            console.log(user);
            debugger
            UserManager.setUser(user)


            this.user = user;
        } catch (err) {
            console.error("Auth error:", err);
            throw new Error("Unauthorized");
        }
    }
}
