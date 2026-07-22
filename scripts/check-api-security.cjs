const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const failures = [];
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const walk = (directory) => fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
});

const source = walk(path.join(root, "src"))
    .filter((file) => /\.(js|jsx|json)$/.test(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

for (const [label, pattern] of [
    ["legacy browser token", /marker_im_token/],
    ["static admin header", /x-marker-admin-auth/],
    ["static admin credential", /barev123|super_user/],
    ["JWT session code", /jsonwebtoken|jwt\.sign/],
    ["legacy fallback secret", /gagooooooo/],
]) {
    if (pattern.test(source)) failures.push(`Found ${label}`);
}

for (const [label, file, pattern] of [
    ["session tokens are hashed", "src/app/api/_auth/session.js", /tokenHash: hashSessionToken\(token\)/],
    ["session expiry is enforced", "src/app/api/_auth/session.js", /expiresAt: \{\$gt: now\}/],
    ["cookies are HttpOnly", "src/app/api/_auth/session.js", /httpOnly: true/],
    ["admin login requires role", "src/app/api/admin/auth/login/route.js", /user\?\.role !== "admin"/],
    ["admin routes require role", "src/app/api/admin/users/route.js", /await requireAdmin\(request\)/],
    ["private profiles are hidden", "src/app/api/profile/get-profile/route.js", /profileUser\.publicProfile === false/],
    ["private event subscription is blocked", "src/app/api/event/subscribe-event/route.js", /event\.isPrivate/],
    ["message preferences are enforced", "src/app/api/message/send-message/route.js", /allowMessages === false/],
    ["Mongo-backed rate limiting", "src/server/security/rate-limiter.js", /rate_limits/],
    ["rate limits return 429", "src/server/security/rate-limiter.js", /status: 429/],
    ["login rate limiting", "src/app/api/auth/login/route.js", /enforceIpRateLimit/],
    ["upload magic-byte validation", "src/server/uploads/image-validation.js", /matchesSignature/],
    ["post cursor pagination", "src/app/api/post/get-user-posts/route.js", /nextCursor/],
    ["event cursor pagination", "src/app/api/event/get-user-events/route.js", /nextCursor/],
    ["transaction helper", "src/server/database/with-mongo-transaction.js", /withTransaction/],
    ["profile update transaction", "src/app/api/profile/update-profile/route.js", /withMongoTransaction/],
]) {
    if (!pattern.test(read(file))) failures.push(`Missing: ${label}`);
}

if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
}

console.log("API P0/P1 security regression checks passed.");
