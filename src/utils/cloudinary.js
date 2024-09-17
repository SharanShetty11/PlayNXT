import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Upload files
const uploadOnCloudinary = async (localfilePath) => {
    try {
        if (!localfilePath) return null; // If file path doesn't exist

        console.log("Attempting to upload file from:", localfilePath); // Log the path from which the file is being uploaded

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localfilePath,
            {
                resource_type: 'auto'
            });

        console.log("File has been uploaded successfully on Cloudinary:", response.url); // Log success message

        fs.unlinkSync(localfilePath, (err) => {
            if (err) console.error("Failed to delete local file:", err);
            else console.log("Local file deleted successfully.");
        }); // Asynchronously remove locally saved temp file and log result

        return response;

    } catch (error) {
        console.error("Failed to upload image to Cloudinary:", error); // Log detailed error message

        fs.unlinkSync(localfilePath, (err) => {
            if (err) console.error("Failed to delete local file:", err);
            else console.log("Local file deleted successfully.");
        });

        return null;
    }
};

export { uploadOnCloudinary };
