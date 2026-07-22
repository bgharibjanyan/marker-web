const {loadEnvConfig} = require("@next/env");
const {MongoClient} = require("mongodb");

loadEnvConfig(process.cwd());

const applyChanges = process.argv.includes("--apply");
const adminEmail = String(
    process.env.ADMIN_BOOTSTRAP_EMAIL || "bagratgharibjanyan8@gmail.com",
).trim().toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function findDuplicates(collection, field) {
    return collection.aggregate([
        {$match: {[field]: {$type: "string", $ne: ""}}},
        {$group: {_id: {$toLower: `$${field}`}, count: {$sum: 1}}},
        {$match: {count: {$gt: 1}}},
        {$limit: 10},
    ]).toArray();
}

async function main() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is required");
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    try {
        const db = client.db("marker");
        const users = db.collection("user");
        const sessions = db.collection("session");
        const admin = await users.findOne({
            email: {$regex: `^${escapeRegex(adminEmail)}$`, $options: "i"},
        });
        const [missingRoles, missingStatuses, legacySessions, duplicateEmails, duplicateLogins] = await Promise.all([
            users.countDocuments({role: {$exists: false}}),
            users.countDocuments({status: {$exists: false}}),
            sessions.countDocuments({tokenHash: {$exists: false}}),
            findDuplicates(users, "email"),
            findDuplicates(users, "login"),
        ]);

        console.log(JSON.stringify({
            mode: applyChanges ? "apply" : "dry-run",
            adminEmail,
            adminUserId: admin?._id || null,
            missingRoles,
            missingStatuses,
            legacySessionsToRevoke: legacySessions,
            duplicateEmails,
            duplicateLogins,
        }, null, 2));

        if (!applyChanges) {
            console.log("Dry run only. Re-run with --apply to mutate the database.");
            return;
        }
        if (!admin) {
            throw new Error(`No user found for administrator email ${adminEmail}`);
        }
        if (duplicateEmails.length || duplicateLogins.length) {
            throw new Error("Resolve duplicate emails/logins before applying unique indexes");
        }

        await users.updateMany({role: {$exists: false}}, {$set: {role: "user"}});
        await users.updateMany({status: {$exists: false}}, {$set: {status: "Active"}});
        await users.updateOne({_id: admin._id}, {$set: {role: "admin", status: "Active"}});
        await sessions.deleteMany({tokenHash: {$exists: false}});

        await sessions.createIndex(
            {tokenHash: 1},
            {name: "session_token_hash_unique", unique: true, partialFilterExpression: {tokenHash: {$type: "string"}}},
        );
        await sessions.createIndex(
            {expiresAt: 1},
            {name: "session_expiry_ttl", expireAfterSeconds: 0},
        );
        await users.createIndex(
            {email: 1},
            {name: "user_email_unique", unique: true, partialFilterExpression: {email: {$type: "string"}}, collation: {locale: "en", strength: 2}},
        );
        await users.createIndex(
            {login: 1},
            {name: "user_login_unique", unique: true, partialFilterExpression: {login: {$type: "string"}}, collation: {locale: "en", strength: 2}},
        );

        console.log(`Administrator role assigned to ${adminEmail}. Legacy sessions were revoked.`);
    } finally {
        await client.close();
    }
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
