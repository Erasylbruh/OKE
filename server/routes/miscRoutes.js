import express from 'express';
import { getFonts } from '../controllers/miscController.js';

const router = express.Router();

router.get('/fonts', getFonts);

export default router;