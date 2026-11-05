import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import path from "path";

const uploadOnCloudinary = async (filePath) => {
    if (!filePath) {
        return null;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    const isConfigured = cloudName && apiKey && apiSecret &&
        !cloudName.includes("add your") &&
        !apiKey.includes("add your") &&
        !apiSecret.includes("add your");

    if (isConfigured) {
        try {
            cloudinary.config({ 
                cloud_name: cloudName, 
                api_key: apiKey, 
                api_secret: apiSecret 
            });
            const uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });
            try { fs.unlinkSync(filePath); } catch (e) {}
            return uploadResult.secure_url;
        } catch (error) {
            console.warn("⚠️ Cloudinary upload failed, falling back to local storage:", error.message);
        }
    } else {
        console.warn("⚠️ Cloudinary credentials not configured; serving uploaded file locally from /public");
    }

    // Local file fallback: Keep file in public directory and return static URL
    const fileName = path.basename(filePath);
    const port = process.env.PORT || 8000;
    return `http://localhost:${port}/public/${fileName}`;
}
export default uploadOnCloudinary;