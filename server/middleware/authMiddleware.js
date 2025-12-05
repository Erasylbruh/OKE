import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
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