import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Avatar Storage
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 200, height: 200, crop: 'fill' }]
    }
});

// Preview Storage
const previewStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'previews',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
    }
});

// Audio Storage
const audioStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'audio',
        resource_type: 'auto',
        allowed_formats: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
    }
});

export const uploadAvatar = multer({ storage: avatarStorage });
export const uploadPreview = multer({ storage: previewStorage });
export const uploadAudio = multer({
    storage: audioStorage,
    limits: { fileSize: 50 * 1024 * 1024 }
});