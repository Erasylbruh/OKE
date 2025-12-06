import express from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validation.js';

import { registerSchema, loginSchema } from '../validations/auth.schema.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

export default router;
