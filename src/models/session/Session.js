import { randomBytes } from "crypto";

export default class Session {
    constructor({ userId }) {
        this.userId = userId;
        this.isActive = true;
        this.token = randomBytes(32).toString("hex"); // Generate a random token
        this.createdAt = new Date();
    }
}
