const fs = require("fs");
const path = require("path");

const root = process.cwd();
const apiRoot = path.join(root, "src", "app", "api");
const failures = [];

const walk = (directory) => fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
});

const routeFiles = walk(apiRoot).filter((file) => file.endsWith(`${path.sep}route.js`));
for (const routeFile of routeFiles) {
    const source = fs.readFileSync(routeFile, "utf8");
    const relativePath = path.relative(root, routeFile);
    if (!source.includes("withApiObservability")) {
        failures.push(`${relativePath} is missing withApiObservability`);
    }
}

for (const [relativePath, patterns] of Object.entries({
    "src/middleware.js": ["/api/:path*", "x-request-id", "x-content-type-options"],
    "src/server/http/api-handler.js": ["api.request.completed", "cache-control", "internal_error"],
    "src/server/observability/logger.js": ["JSON.stringify", "LOG_LEVEL", "service"],
    "src/app/api/health/live/route.js": ['status: "ok"'],
    "src/app/api/health/ready/route.js": ["getRuntimeConfigurationProblems", "database: \"failed\""],
})) {
    const source = fs.readFileSync(path.join(root, relativePath), "utf8");
    for (const pattern of patterns) {
        if (!source.includes(pattern)) failures.push(`${relativePath} is missing ${pattern}`);
    }
}

if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
}

console.log(`Operational checks cover ${routeFiles.length} API route files.`);
