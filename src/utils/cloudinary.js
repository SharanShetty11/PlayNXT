import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload files
const uploadOnCloudinary = async (localfilePath) => {
    try {
        if (!localfilePath) return null; //if file path doesn't exist

        //upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: 'auto'
        })

        //file has been uploaded successfullly
        console.log("file is uploaded on cloudinary ", response.url);
        return response;
    }
    catch (error) {
        //reasons for err may be many , but we know file is in localstorage, unlink it
        fs.unlinkSync(localfilePath);   //remove locally saved temp file , here 'Sync' means this stmt must execute.

        return error;

    }
}


export {uploadOnCloudinary}