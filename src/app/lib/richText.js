const allowedRichTextTags = new Set(["a", "b", "br", "em", "font", "i", "li", "ol", "p", "span", "strong", "u", "ul"]);

const escapeAttribute = (value) => (
    String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
);

const isSafeHttpUrl = (value) => {
    try {
        const url = new URL(String(value || "").trim());

        return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
        return false;
    }
};

const getAttributeValue = (attributes = "", name = "") => {
    const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));

    return match?.[1] || match?.[2] || match?.[3] || "";
};

const normalizeCssColor = (value) => {
    const color = String(value || "").trim();

    if (/^#[0-9a-f]{3,8}$/i.test(color)) {
        return color;
    }

    if (/^rgba?\(\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(color)) {
        return color;
    }

    return "";
};

const sanitizeColorStyle = (style = "") => {
    const safeRules = String(style || "")
        .split(";")
        .map((rule) => {
            const separatorIndex = rule.indexOf(":");

            if (separatorIndex === -1) {
                return "";
            }

            const property = rule.slice(0, separatorIndex).trim().toLowerCase();
            const value = normalizeCssColor(rule.slice(separatorIndex + 1));

            if (!value || (property !== "color" && property !== "background-color")) {
                return "";
            }

            return `${property}: ${value}`;
        })
        .filter(Boolean);

    return safeRules.join("; ");
};

export const sanitizeRichText = (value) => {
    let html = String(value || "").trim();

    if (!html) {
        return "";
    }

    html = html
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<\s*(script|style|iframe|object|embed|form|input|button|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
        .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form|input|button|meta|link)[^>]*>/gi, "");

    return html
        .replace(/<\s*(\/?)\s*([a-z0-9]+)\b([^>]*)>/gi, (fullMatch, closingSlash, rawTag, attributes) => {
            const tag = String(rawTag || "").toLowerCase();
            const isClosingTag = Boolean(closingSlash);

            if (!allowedRichTextTags.has(tag)) {
                return "";
            }

            if (tag === "br") {
                return "<br>";
            }

            if (isClosingTag) {
                if (tag === "font") {
                    return "</span>";
                }

                return `</${tag}>`;
            }

            if (tag === "a") {
                const href = getAttributeValue(attributes, "href");

                if (!isSafeHttpUrl(href)) {
                    return "<a>";
                }

                return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">`;
            }

            if (tag === "span") {
                const style = sanitizeColorStyle(getAttributeValue(attributes, "style"));

                return style ? `<span style="${escapeAttribute(style)}">` : "<span>";
            }

            if (tag === "font") {
                const color = normalizeCssColor(getAttributeValue(attributes, "color"));

                return color ? `<span style="color: ${escapeAttribute(color)}">` : "<span>";
            }

            return `<${tag}>`;
        })
        .trim();
};

export const stripRichText = (value) => (
    String(value || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|li)>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
);
