export const ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

export class UploadValidationError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "UploadValidationError";
        this.status = status;
    }
}

const matchesSignature = (buffer, type) => {
    if (type === "image/jpeg") {
        return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (type === "image/png") {
        return buffer.length >= 8
            && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (type === "image/gif") {
        const signature = buffer.subarray(0, 6).toString("ascii");
        return signature === "GIF87a" || signature === "GIF89a";
    }
    if (type === "image/webp") {
        return buffer.length >= 12
            && buffer.subarray(0, 4).toString("ascii") === "RIFF"
            && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    }
    return false;
};

export const validateImageFile = async (file, {maxBytes = 5 * 1024 * 1024} = {}) => {
    if (!file || typeof file.arrayBuffer !== "function") {
        throw new UploadValidationError("Image file is required");
    }
    if (!ALLOWED_IMAGE_TYPES[file.type]) {
        throw new UploadValidationError("Only JPG, PNG, WEBP, and GIF images are allowed");
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > maxBytes) {
        throw new UploadValidationError(`Image must be smaller than ${Math.floor(maxBytes / 1024 / 1024)}MB`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length !== file.size || !matchesSignature(buffer, file.type)) {
        throw new UploadValidationError("Image content does not match its declared file type");
    }

    return {buffer, extension: ALLOWED_IMAGE_TYPES[file.type], mimeType: file.type};
};

export const multipartRequestLimit = (fileCount, maxFileBytes, overheadBytes = 1024 * 1024) => (
    fileCount * maxFileBytes + overheadBytes
);
