const {loadEnvConfig} = require("@next/env");
const {MongoClient} = require("mongodb");

loadEnvConfig(process.cwd());
const applyChanges = process.argv.includes("--apply");

async function main() {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    try {
        const db = client.db("marker");
        const plannedIndexes = [
            {collection: "user", name: "user_search_text"},
            {collection: "events", name: "event_search_text"},
            {collection: "tag", name: "tag_popularity"},
        ];
        console.log(JSON.stringify({mode: applyChanges ? "apply" : "dry-run", plannedIndexes}, null, 2));
        if (!applyChanges) return;

        await db.collection("user").createIndex(
            {firstname: "text", lastname: "text", login: "text", email: "text", country: "text", city: "text"},
            {name: "user_search_text", weights: {login: 10, firstname: 5, lastname: 5, email: 3}},
        );
        await db.collection("events").createIndex(
            {title: "text", description: "text", location: "text"},
            {name: "event_search_text", weights: {title: 10, location: 5, description: 1}},
        );
        await db.collection("tag").createIndex(
            {usage: -1, name: 1},
            {name: "tag_popularity"},
        );
        console.log("Search and tag popularity indexes created.");
    } finally {
        await client.close();
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
