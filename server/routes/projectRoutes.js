import express from 'express';
import { z } from 'zod';
import * as projectController from '../controllers/projectController.js';
import * as commentController from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

const router = express.Router();

// Multer Config
cloudinary.config(config.cloudinary);

const audioStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'audio',
        resource_type: 'auto',
        allowed_formats: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
    }
});
const uploadAudio = multer({
    storage: audioStorage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

const previewStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'previews',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
    }
});
const uploadPreview = multer({ storage: previewStorage });

const projectSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        data: z.any().optional(),
        is_public: z.any().transform(val => val === 'true' || val === true || val === 1).optional()
    })
});

const visibilitySchema = z.object({
    body: z.object({
        is_public: z.boolean()
    })
});

const commentSchema = z.object({
    body: z.object({
        content: z.string().min(1),
        parent_id: z.number().int().optional()
    })
});

// Middleware for optional auth
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        authenticateToken(req, res, next);
    } else {
        next();
    }
};

// Routes
router.get('/public', projectController.getPublicProjects);
router.get('/following', authenticateToken, projectController.getFollowingProjects);
router.get('/:id', optionalAuth, projectController.getProject);
router.get('/', authenticateToken, projectController.getMyProjects);
router.post('/', authenticateToken, validate(projectSchema), projectController.createProject);
router.put('/:id', authenticateToken, validate(projectSchema), projectController.updateProject);
router.delete('/:id', authenticateToken, projectController.deleteProject);
router.patch('/:id/visibility', authenticateToken, validate(visibilitySchema), projectController.updateVisibility);

// Media
router.post('/:id/audio', authenticateToken, uploadAudio.single('audio'), projectController.uploadAudio);
router.delete('/:id/audio', authenticateToken, projectController.deleteAudio);

router.post('/:id/preview', authenticateToken, uploadPreview.single('preview'), projectController.uploadPreview);
router.delete('/:id/preview/:slot', authenticateToken, projectController.deletePreview);
router.put('/:id/preview/main', authenticateToken, projectController.setMainPreview);

// Comments (Nested under project)
router.get('/:id/comments', optionalAuth, commentController.getComments);
router.post('/:id/comments', authenticateToken, validate(commentSchema), commentController.addComment);

export default router;
