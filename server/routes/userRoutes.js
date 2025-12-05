import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../config/cloudinary.js';
import {
    getSettings,
    updateSettings,
    updateProfile,
    deleteUser,
    getLikedProjects,
    getUserProfile,
    followUser,
    unfollowUser,
    getFollowing
} from '../controllers/userController.js';

const router = express.Router();

router.get('/settings', authenticateToken, getSettings);
router.put('/settings', authenticateToken, updateSettings);
router.put('/profile', authenticateToken, uploadAvatar.single('avatar'), updateProfile);
router.delete('/:id', authenticateToken, deleteUser);
router.get('/likes', authenticateToken, getLikedProjects);
router.get('/me/following', authenticateToken, getFollowing);
router.get('/:username', getUserProfile);
router.post('/:id/follow', authenticateToken, followUser);
router.delete('/:id/follow', authenticateToken, unfollowUser);

export default router;