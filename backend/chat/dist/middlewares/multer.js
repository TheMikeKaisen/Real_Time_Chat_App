import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Cloudinary from "../config/cloudinary.js";
const storage = new CloudinaryStorage({
    cloudinary: Cloudinary,
    params: {
        folder: 'chat-images',
        format: ["jpg", "jpeg", "png", "gif", "webp"], // supports promises as well
        transformation: [
            {
                width: 800,
                height: 600,
                crop: "limit"
            },
            {
                quality: "auto"
            }
        ]
    },
});
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5mb
    },
    // this callback function is defined by multer itself and not by the developer.
    // this callback function will decide if the file should be accepted or not
    fileFilter(req, file, cb) {
        // mimetype is an international standard to define file types
        // for images: image/png or image/jpg, etc
        // for pdf: application/pdf, etc
        if (file.mimetype.startsWith("image/")) {
            // cb(error, true/false) // true -> accept the file and call next function || false -> decline 
            cb(null, true);
        }
        else {
            cb(new Error("only image allowed"));
        }
    },
});
