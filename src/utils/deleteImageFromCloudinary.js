import { v2 as cloudinary } from 'cloudinary'
import { ApiError } from './ApiError.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


/**
 * Deletes an image from Cloudinary using its public ID.
 * @param {string} publicId - The public ID of the image to delete.
 * @returns {Promise<void>} - A promise that resolves when the image is deleted.
 */

export const deleteImageFromCloudinary = async (publicId) => {
    try{
        await cloudinary.uploader.destroy(publicId);
        console.log("old image deleted successfully")
    }
    catch(error){
        throw new ApiError(501, "Error while deleting image from Cloudinary")
    }
}