const fs = require("fs");
const path = require("path");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];
const apiRoot = path.join(process.cwd(), "src", "app", "api");
const specPath = path.join(process.cwd(), "src", "app", "lib", "swagger", "openapi.json");

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const documentedPaths = spec.paths || {};

const walk = (directory) => {
    const entries = fs.readdirSync(directory, {withFileTypes: true});

    return entries.flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return walk(fullPath);
        }

        return entry.isFile() && entry.name === "route.js" ? [fullPath] : [];
    });
};

const getEndpointPath = (routeFile) => {
    const routeDirectory = path.dirname(routeFile);
    const relativePath = path.relative(apiRoot, routeDirectory).split(path.sep).join("/");

    return `/api/${relativePath}`;
};

const getExportedMethods = (routeFile) => {
    const source = fs.readFileSync(routeFile, "utf8");
    const functionMatches = [...source.matchAll(
        /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g,
    )];
    const constantMatches = [...source.matchAll(
        /export\s+const\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*=/g,
    )];

    return [...functionMatches, ...constantMatches].map((match) => match[1].toLowerCase());
};
const routeFiles = walk(apiRoot);
const problems = [];

for (const routeFile of routeFiles) {
    const endpointPath = getEndpointPath(routeFile);
    const pathItem = documentedPaths[endpointPath];

    if (!pathItem) {
        problems.push(`Missing Swagger path: ${endpointPath}`);
        continue;
    }

    const methods = getExportedMethods(routeFile);

    for (const method of methods) {
        if (!pathItem[method]) {
            problems.push(`Missing Swagger method: ${method.toUpperCase()} ${endpointPath}`);
        }
    }
}

for (const endpointPath of Object.keys(documentedPaths)) {
    if (!endpointPath.startsWith("/api/")) {
        continue;
    }

    const routeFile = path.join(apiRoot, endpointPath.replace(/^\/api\//, ""), "route.js");

    if (!fs.existsSync(routeFile)) {
        problems.push(`Swagger path has no route file: ${endpointPath}`);
        continue;
    }

    const pathItem = documentedPaths[endpointPath];
    const implementedMethods = new Set(getExportedMethods(routeFile));

    for (const method of HTTP_METHODS) {
        if (pathItem[method] && !implementedMethods.has(method)) {
            problems.push(`Swagger documents unimplemented method: ${method.toUpperCase()} ${endpointPath}`);
        }
    }
}

if (problems.length) {
    console.error("Swagger documentation is out of sync:");
    problems.forEach((problem) => console.error(`- ${problem}`));
    process.exit(1);
}

console.log(`Swagger documentation covers ${routeFiles.length} API route files.`);
