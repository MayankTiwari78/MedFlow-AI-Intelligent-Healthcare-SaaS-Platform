import fs from "node:fs/promises";

import { cloudinary } from "../config/cloudinary.js";

export const uploadImageToCloudinary = async (filePath: string): Promise<string> => {
  try {
    const upload = await cloudinary.uploader.upload(filePath, { resource_type: "image" });
    return upload.secure_url;
  } finally {
    await fs.rm(filePath, { force: true }).catch(() => undefined);
  }
};
