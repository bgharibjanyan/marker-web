const fs = require("fs");
const path = require("path");

const locales = ["en", "ru", "arm"];
const catalogs = Object.fromEntries(locales.map((locale) => [
    locale,
    JSON.parse(fs.readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8")),
]));

const flatten = (value, prefix = "", output = new Map()) => {
    for (const [key, child] of Object.entries(value)) {
        const childPath = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === "object" && !Array.isArray(child)) {
            flatten(child, childPath, output);
        } else {
            output.set(childPath, child);
        }
    }
    return output;
};

const reference = flatten(catalogs.en);
const failures = [];

for (const locale of locales.slice(1)) {
    const candidate = flatten(catalogs[locale]);
    for (const key of reference.keys()) {
        if (!candidate.has(key)) failures.push(`${locale} is missing ${key}`);
    }
    for (const key of candidate.keys()) {
        if (!reference.has(key)) failures.push(`${locale} has unexpected key ${key}`);
    }
}

if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
}

console.log(`Locale catalogs are structurally aligned across ${locales.join(", ")}.`);
