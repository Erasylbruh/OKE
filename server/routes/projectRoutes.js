import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { uploadPreview, uploadAudio } from '../config/cloudinary.js';
import {
    getFollowingProjects,
    getPublicProjects,
    getProjectById,
    getUserProjects,
    createProject,
    updateProject,
    deleteProject,
    updateVisibility,
    uploadPreview as uploadPreviewController,
    deletePreview,
    setMainPreview,
    uploadAudio as uploadAudioController,
    deleteAudio,
    likeProject,
    checkLikeStatus
} from '../controllers/projectController.js';
import {
    getComments,
    addComment
} from '../controllers/commentController.js';

const router = express.Router();

// Specific routes first
router.get('/following', authenticateToken, getFollowingProjects);
router.get('/public', getPublicProjects);

// CRUD
router.get('/', authenticateToken, getUserProjects);
router.post('/', authenticateToken, createProject);
router.get('/:id', getProjectById);
router.put('/:id', authenticateToken, updateProject);
router.delete('/:id', authenticateToken, deleteProject);
router.patch('/:id/visibility', authenticateToken, updateVisibility);

// Media
router.post('/:id/preview', authenticateToken, uploadPreview.single('preview'), uploadPreviewController);
router.delete('/:id/preview/:slot', authenticateToken, deletePreview);
router.put('/:id/preview/main', authenticateToken, setMainPreview);
router.post('/:id/audio', authenticateToken, uploadAudio.single('audio'), uploadAudioController);
router.delete('/:id/audio', authenticateToken, deleteAudio);

// Likes
router.post('/:id/like', authenticateToken, likeProject);
router.get('/:id/like', authenticateToken, checkLikeStatus);

// Project Comments (Nested)
router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateToken, addComment);

export default router;