import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    deleteComment,
    togglePinComment,
    likeComment
} from '../controllers/commentController.js';

const router = express.Router();

router.delete('/:id', authenticateToken, deleteComment);
router.post('/:id/pin', authenticateToken, togglePinComment);
router.post('/:id/like', authenticateToken, likeComment);

export default router;