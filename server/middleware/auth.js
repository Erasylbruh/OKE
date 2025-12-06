import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
            console.error('JWT Verify Error:', err);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

export const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && (req.user.is_admin || req.user.is_admin === 1)) {
            next();
        } else {
            console.log('Admin check failed for user:', req.user.id);
            res.sendStatus(403);
        }
    });
};
