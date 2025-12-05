import express from 'express';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import {
    getUsers,
    getProjects,
    deleteUser
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticateAdmin);

router.get('/users', getUsers);
router.get('/projects', getProjects);
router.delete('/users/:id', deleteUser);

export default router;