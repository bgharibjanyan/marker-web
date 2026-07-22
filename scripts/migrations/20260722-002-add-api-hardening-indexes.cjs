const {loadEnvConfig} = require("@next/env");
const {MongoClient} = require("mongodb");

loadEnvConfig(process.cwd());

const applyChanges = process.argv.includes("--apply");

async function duplicateGroups(collection, pipeline) {
    return collection.aggregate([...pipeline, {$match: {count: {$gt: 1}}}, {$limit: 20}]).toArray();
}

async function main() {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    try {
        const db = client.db("marker");
        const tasks = db.collection("tasks");
        const tags = db.collection("tag");
        const rateLimits = db.collection("rate_limits");
        const [duplicateSubscriptions, duplicateTags, staleRateLimits] = await Promise.all([
            duplicateGroups(tasks, [
                {$match: {userId: {$type: "objectId"}, sourceEventId: {$type: "objectId"}}},
                {$group: {_id: {userId: "$userId", sourceEventId: "$sourceEventId"}, count: {$sum: 1}}},
            ]),
            duplicateGroups(tags, [
                {$match: {name: {$type: "string", $ne: ""}}},
                {$group: {_id: {$toLower: "$name"}, count: {$sum: 1}}},
            ]),
            rateLimits.countDocuments({expiresAt: {$exists: false}}),
        ]);

        console.log(JSON.stringify({
            mode: applyChanges ? "apply" : "dry-run",
            duplicateSubscriptions,
            duplicateTags,
            staleRateLimits,
        }, null, 2));

        if (!applyChanges) {
            console.log("Dry run only. Re-run with --apply to create P1 indexes.");
            return;
        }
        if (duplicateSubscriptions.length || duplicateTags.length) {
            throw new Error("Resolve duplicate event subscriptions/tags before applying unique indexes");
        }

        await rateLimits.deleteMany({expiresAt: {$exists: false}});
        await rateLimits.createIndex({expiresAt: 1}, {
            name: "rate_limit_expiry_ttl",
            expireAfterSeconds: 0,
        });
        await tags.createIndex({name: 1}, {
            name: "tag_name_unique",
            unique: true,
            partialFilterExpression: {name: {$type: "string"}},
            collation: {locale: "en", strength: 2},
        });
        await tasks.createIndex({userId: 1, sourceEventId: 1}, {
            name: "task_user_event_unique",
            unique: true,
            partialFilterExpression: {
                userId: {$type: "objectId"},
                sourceEventId: {$type: "objectId"},
            },
        });
        await tasks.createIndex({userId: 1, _id: -1}, {name: "task_user_cursor"});
        await db.collection("posts").createIndex({userId: 1, _id: -1}, {name: "post_user_cursor"});
        await db.collection("events").createIndex({userId: 1, _id: -1}, {name: "event_user_cursor"});
        await db.collection("events").createIndex({isPrivate: 1, _id: -1}, {name: "event_visibility_cursor"});
        await db.collection("message").createIndex(
            {sender: 1, reciver: 1, time: -1, _id: -1},
            {name: "message_sender_receiver_cursor"},
        );
        await db.collection("message").createIndex(
            {reciver: 1, sender: 1, time: -1, _id: -1},
            {name: "message_receiver_sender_cursor"},
        );

        console.log("P1 rate-limit, uniqueness, and cursor indexes created.");
    } finally {
        await client.close();
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
