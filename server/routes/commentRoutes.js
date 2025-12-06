import express from 'express';
import { z } from 'zod';
import * as commentController from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const commentSchema = z.object({
    body: z.object({
        content: z.string().min(1),
        parent_id: z.number().int().optional()
    })
});

const pinSchema = z.object({
    body: z.object({
        is_pinned: z.boolean()
    })
});

// Optional auth for getting comments
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        authenticateToken(req, res, next);
    } else {
        next();
    }
};

// Project comments: /api/projects/:id/comments
// Comments operations: /api/comments/:id
// We might need to split this in index.js mounting or handle both here.
// Router here will be mounted on /api/comments so we only handle comment_id operations here?
// But getComments and addComment are on project_id.
// Common pattern: Mount separate routers.
// ProjectRouter has nested comments? Or clean separation.
// Server/index.js will route /api/projects/:project_id/comments to CommentController via ProjectRouter
// AND /api/comments/:id to CommentRouter.

// Let's define routes relative to where they will be mounted.
// I'll make this file export TWO routers or just handle logic in index.js to attach specific paths.
// Better: handle /api/comments routes here. Project-comment routes in projectRoutes or handled there.
// I will move `getComments` and `addComment` to `projectRoutes.js` (or imported there) to keep clean URL structure
// /api/projects/:id/comments.

// Wait, standard practice:
// router.use('/:projectId/comments', commentRouter) nested in project routes.
// But for now I will put "comment operations" here.
// DELETE /api/comments/:id
// POST /api/comments/:id/like
// DELETE /api/comments/:id/like
// PATCH /api/comments/:id/pin

router.delete('/:id', authenticateToken, commentController.deleteComment);
router.post('/:id/like', authenticateToken, commentController.likeComment);
router.delete('/:id/like', authenticateToken, commentController.unlikeComment);
router.patch('/:id/pin', authenticateToken, validate(pinSchema), commentController.pinComment);

export default router;

// AND I need to add the get/post comments to projectRoutes or a separate 'projectComments' router.
// I will add them to `projectRoutes.js` for simplicity as they hang off `/projects/:id`.
