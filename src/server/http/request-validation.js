export const MAX_JSON_BODY_BYTES = 64 * 1024;

export const rejectOversizedRequest = (request, maxBytes = MAX_JSON_BODY_BYTES) => {
    const contentLengthHeader = request.headers.get("content-length");
    const transferEncoding = request.headers.get("transfer-encoding");
    const hasBody = !["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase());

    if (hasBody && transferEncoding) {
        return Response.json({error: "Chunked request bodies are not accepted"}, {status: 411});
    }
    if (hasBody && !contentLengthHeader) {
        return Response.json({error: "Content-Length is required"}, {status: 411});
    }

    const contentLength = Number(contentLengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
        return Response.json({error: "Invalid Content-Length"}, {status: 400});
    }
    if (contentLength > maxBytes) {
        return Response.json({error: "Request body is too large"}, {status: 413});
    }    return null;
};

export const normalizeBoundedString = (value, {
    min = 0,
    max,
    lowercase = false,
    trim = true,
} = {}) => {
    const rawValue = String(value ?? "");
    const normalized = trim ? rawValue.trim() : rawValue;
    const output = lowercase ? normalized.toLowerCase() : normalized;
    if (output.length < min || (max && output.length > max)) {
        return null;    }
    return output;
};

export const isValidEmail = (value) => (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""))
);

export const isPlainObject = (value) => (
    Boolean(value) && typeof value === "object" && !Array.isArray(value)
);
