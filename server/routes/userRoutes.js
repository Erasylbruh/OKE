import express from 'express';
import { z } from 'zod';
import * as userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js'; // Need to extract this middleware
import { validate } from '../middleware/validation.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

const router = express.Router();

// Multer setup (duplicate config for now, will fix imports later)
cloudinary.config(config.cloudinary);
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 200, height: 200, crop: 'fill' }]
    }
});
const uploadAvatar = multer({ storage: avatarStorage });

const updateSettingsSchema = z.object({
    body: z.object({
        password: z.string().min(8).regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&]).*$/).optional(),
        language: z.string().optional()
    })
});

// Middleware for optional auth (for public profile)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        authenticateToken(req, res, next);
    } else {
        next();
    }
};

router.get('/settings', authenticateToken, userController.getSettings);
router.put('/settings', authenticateToken, validate(updateSettingsSchema), userController.updateSettings);
router.put('/profile', authenticateToken, uploadAvatar.single('avatar'), userController.updateProfile);
router.delete('/:id', authenticateToken, userController.deleteUser);
router.get('/likes', authenticateToken, userController.getLikes);
router.get('/me/following', authenticateToken, userController.getFollowing);
router.post('/:id/follow', authenticateToken, userController.follow);
router.delete('/:id/follow', authenticateToken, userController.unfollow);

// Public route at the end to avoid conflicts? params :username vs specific paths
// But here paths like 'settings' are defined before :username so it should be fine if mounted correctly.
// Actually in index.js it was /api/users/:username, so routes should be careful.
// Recommended to keep :username specific routes separately or ensuring regex match if we were using same router level.
// Here we can use specific router.
router.get('/:username', optionalAuth, userController.getProfile);

export default router;
