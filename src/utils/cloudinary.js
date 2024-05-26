import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

 const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("Image uploaded on cloudinary", res.url);
        fs.unlinkSync(localFilePath)
        return res;
    } catch (err) {
        fs.unlinkSync(localFilePath);
        console.log(err);
        return null;
    }
}

 const deleteFromCloudinary = async (public_id) => {
    try {
        if (!public_id) return null;
        const res = await cloudinary.uploader.destroy(public_id);
        console.log("Image deleted from cloudinary", res);
        return res;
    } catch (err) {
        console.log(err);
        return null;
    }
}

export { uploadOnCloudinary }