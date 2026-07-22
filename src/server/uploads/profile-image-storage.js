import {mkdir, unlink, writeFile} from "fs/promises";
import path from "path";
import {randomUUID} from "crypto";
import {validateImageFile} from "@/server/uploads/image-validation";

const publicPrefix = "/uploads/profiles/";
const uploadDirectory = path.join(process.cwd(), "public", "uploads", "profiles");

export const storeProfileImage = async (file, userId) => {
    const {buffer, extension} = await validateImageFile(file);
    const fileName = `${String(userId)}-${randomUUID()}.${extension}`;
    const filePath = path.join(uploadDirectory, fileName);

    await mkdir(uploadDirectory, {recursive: true});
    await writeFile(filePath, buffer, {flag: "wx"});

    return {
        filePath,
        publicPath: `${publicPrefix}${fileName}`,
    };
};

export const removeProfileImage = async (publicPath) => {
    if (!String(publicPath || "").startsWith(publicPrefix)) {
        return;
    }

    const fileName = path.basename(publicPath);
    await unlink(path.join(uploadDirectory, fileName)).catch((error) => {
        if (error?.code !== "ENOENT") throw error;
    });
};
