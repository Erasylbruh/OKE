import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import rateLimit from 'express-rate-limit';
import db from './db.js';
import { validateEnv } from './validateEnv.js';

dotenv.config();

// Validate environment variables before starting server
validateEnv();

const app = express();

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JWT Secret - REQUIRED
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}
const SECRET_KEY = process.env.JWT_SECRET;

// Init DB
const initDb = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nickname VARCHAR(255),
                avatar_url VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                data JSON,
                is_public BOOLEAN DEFAULT FALSE,
                preview_url VARCHAR(255),
                preview_urls JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Add preview_urls column if it doesn't exist
        try {
            await db.query('ALTER TABLE projects ADD COLUMN preview_urls JSON');
        } catch (e) {
            // Ignore error if column already exists
        }

        // Add preview_url column if it doesn't exist (legacy support)
        try {
            await db.query('ALTER TABLE projects ADD COLUMN preview_url VARCHAR(255)');
        } catch (e) {
            // Ignore error if column already exists
        }

        // Add audio_url column if it doesn't exist
        try {
            await db.query('ALTER TABLE projects ADD COLUMN audio_url VARCHAR(255)');
        } catch (e) {
            // Ignore error if column already exists
        }

        // Add language column to users if not exists
        try {
            await db.query("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en'");
        } catch (e) { }

        await db.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                parent_id INT DEFAULT NULL,
                is_pinned BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
            )
        `);

        // Add parent_id and is_pinned columns to comments if not exists
        try { await db.query("ALTER TABLE comments ADD COLUMN parent_id INT DEFAULT NULL"); } catch (e) { }
        try { await db.query("ALTER TABLE comments ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE"); } catch (e) { }
        try { await db.query("ALTER TABLE comments ADD CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE"); } catch (e) { }

        await db.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                project_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (user_id, project_id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS followers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                follower_id INT NOT NULL,
                following_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_follow (follower_id, following_id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS comment_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                comment_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                UNIQUE KEY unique_comment_like (user_id, comment_id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'reply', 'follow'
                source_id INT NOT NULL, -- project_id, comment_id, or follower_id
                trigger_user_id INT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (trigger_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Database initialized');

        // Seed Admin User from environment variables
        if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
            const adminUsername = process.env.ADMIN_USERNAME;
            const [admins] = await db.query('SELECT id FROM users WHERE username = ?', [adminUsername]);
            if (admins.length === 0) {
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
                await db.query(
                    'INSERT INTO users (username, password_hash, nickname, is_admin) VALUES (?, ?, ?, ?)',
                    [adminUsername, hashedPassword, 'Super Admin', true]
                );
                console.log('Admin user seeded successfully');
            }
        } else {
            console.warn('WARNING: ADMIN_USERNAME and ADMIN_PASSWORD not set. Admin user not seeded.');
        }

        // Run migrations
        const { runMigrations } = await import('./runMigrations.js');
        await runMigrations(db);
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};
initDb();

// Helper function for safe JSON parsing
const parseJSONField = (field, fallback = []) => {
    if (!field) return fallback;
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    }
    return fallback;
};

// Middleware
const authenticateToken = (req, res, next) => {
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

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user && (req.user.is_admin || req.user.is_admin === 1)) {
            next();
        } else {
            console.log('Admin check failed for user:', req.user.id);
            res.sendStatus(403);
        }
    });
};

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts, please try again later.'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

// Apply general API rate limiting
app.use('/api/', apiLimiter);

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Multer Setup (Cloudinary)
// Avatar Storage (Resized)
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 200, height: 200, crop: 'fill' }]
    }
});
const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Preview Storage (Resized to 400x400)
const previewStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'previews',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
    }
});
const uploadPreview = multer({
    storage: previewStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Audio Storage
const audioStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'audio',
        resource_type: 'auto', // Important for audio
        allowed_formats: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
    }
});
const uploadAudio = multer({
    storage: audioStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

// Auth
app.post('/api/auth/register', authLimiter, async (req, res) => {
    let { username, password } = req.body;
    username = username.toLowerCase();

    // Validation
    const usernameRegex = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6,}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).send('Username must be at least 6 characters and contain both letters and digits.');
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&])[a-zA-Z\d@#$%&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).send('Password must be at least 8 characters and contain letters, digits, and a special character (@, #, $, %, &).');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];
        if (!user) return res.status(400).send('User not found');

        if (await bcrypt.compare(password, user.password_hash)) {
            const token = jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, SECRET_KEY);
            res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin, nickname: user.nickname, avatar_url: user.avatar_url } });
        } else {
            res.status(403).send('Invalid credentials');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// User Profile & Settings
app.get('/api/users/settings', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT username, nickname, avatar_url, language, is_admin FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).send('User not found');
        res.json(users[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/api/users/settings', authenticateToken, async (req, res) => {
    const { password, language } = req.body;
    try {
        if (password) {
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&])[a-zA-Z\d@#$%&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).send('Password must be at least 8 characters and contain letters, digits, and a special character (@, #, $, %, &).');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);
        }

        if (language) {
            await db.execute('UPDATE users SET language = ? WHERE id = ?', [language, req.user.id]);
        }

        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/api/users/profile', authenticateToken, uploadAvatar.single('avatar'), async (req, res) => {
    const { nickname } = req.body;
    let avatar_url = req.body.avatar_url;

    if (req.file) {
        avatar_url = req.file.path;
    }

    try {
        await db.execute('UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?', [nickname, avatar_url, req.user.id]);
        res.json({ message: 'Profile updated', avatar_url });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        if (parseInt(req.params.id) !== req.user.id && !req.user.is_admin) {
            return res.status(403).send('Unauthorized');
        }

        // Delete user's projects
        await db.execute('DELETE FROM projects WHERE user_id = ?', [req.params.id]);

        // Delete user
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).send('User not found');
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Likes Route (Must be before /api/users/:username)
app.get('/api/users/likes', authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(`
            SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.is_public, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url,
            (SELECT COUNT(*) FROM likes l2 WHERE l2.project_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
            FROM projects p 
            JOIN likes l ON p.id = l.project_id 
            JOIN users u ON p.user_id = u.id 
            WHERE l.user_id = ?
            ORDER BY l.created_at DESC
        `, [req.user.id]);
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Public Profile & Following
app.get('/api/users/:username', async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, nickname, avatar_url, created_at FROM users WHERE username = ?', [req.params.username]);
        if (users.length === 0) return res.status(404).send('User not found');
        const user = users[0];

        const [projects] = await db.execute(`
            SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.created_at, p.updated_at,
            (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
            FROM projects p 
            WHERE p.user_id = ? AND p.is_public = TRUE 
            ORDER BY p.updated_at DESC
        `, [user.id]);

        const [followers] = await db.execute('SELECT COUNT(*) as count FROM followers WHERE following_id = ?', [user.id]);
        const [following] = await db.execute('SELECT COUNT(*) as count FROM followers WHERE follower_id = ?', [user.id]);

        // Check if current user is following (if authenticated)
        let isFollowing = false;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                const [check] = await db.execute('SELECT id FROM followers WHERE follower_id = ? AND following_id = ?', [decoded.id, user.id]);
                isFollowing = check.length > 0;
            } catch (e) { }
        }

        res.json({
            ...user,
            projects,
            followersCount: followers[0].count,
            followingCount: following[0].count,
            isFollowing
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Follow Endpoints
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) return res.status(400).send('Cannot follow yourself');

        await db.execute(
            'INSERT IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)',
            [req.user.id, req.params.id]
        );

        // Notification
        await db.execute(
            'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
            [req.params.id, 'follow', req.user.id, req.user.id]
        );

        res.json({ message: 'Followed' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/api/users/:id/follow', authenticateToken, async (req, res) => {
    try {
        await db.execute(
            'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
            [req.user.id, req.params.id]
        );
        res.json({ message: 'Unfollowed' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/users/me/following', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT u.id, u.username, u.nickname, u.avatar_url 
            FROM users u
            JOIN followers f ON u.id = f.following_id
            WHERE f.follower_id = ?
        `, [req.user.id]);
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/projects/following', authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(`
            SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
            FROM projects p 
            JOIN users u ON p.user_id = u.id 
            JOIN followers f ON u.id = f.following_id
            WHERE f.follower_id = ? AND p.is_public = TRUE
            ORDER BY p.updated_at DESC
        `, [req.user.id]);
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/projects/:id/preview', authenticateToken, uploadPreview.single('preview'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    const slot = parseInt(req.body.slot) || 0;

    try {
        const preview_url = req.file.path;

        // Get existing previews
        const [projects] = await db.execute(
            'SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        let previewUrls = parseJSONField(projects[0].preview_urls, []);

        // Update specific slot
        previewUrls[slot] = preview_url;

        // Limit to 3
        previewUrls = previewUrls.slice(0, 3);

        const [result] = await db.execute(
            'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(previewUrls), previewUrls[0], req.params.id, req.user.id]
        );

        res.json({ message: 'Preview updated', preview_urls: previewUrls });
    } catch (err) {
        console.error('Preview upload error:', err);
        res.status(500).send(err.message);
    }
});

app.post('/api/projects/:id/audio', authenticateToken, uploadAudio.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');

    try {
        const audio_url = req.file.path;

        const [projects] = await db.execute(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        await db.execute(
            'UPDATE projects SET audio_url = ? WHERE id = ?',
            [audio_url, req.params.id]
        );

        res.json({ message: 'Audio uploaded', audio_url });
    } catch (err) {
        console.error('Audio upload error:', err);
        res.status(500).send(err.message);
    }
});

app.delete('/api/projects/:id/audio', authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        await db.execute(
            'UPDATE projects SET audio_url = NULL WHERE id = ?',
            [req.params.id]
        );

        res.json({ message: 'Audio deleted' });
    } catch (err) {
        console.error('Audio delete error:', err);
        res.status(500).send(err.message);
    }
});

app.delete('/api/projects/:id/preview/:slot', authenticateToken, async (req, res) => {
    const slot = parseInt(req.params.slot);
    if (isNaN(slot) || slot < 0 || slot > 2) return res.status(400).send('Invalid slot');

    try {
        const [projects] = await db.execute(
            'SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        let previewUrls = parseJSONField(projects[0].preview_urls, []);

        // Remove the item at the slot (set to null)
        previewUrls[slot] = null;

        // Update DB
        // Also update preview_url (legacy) to the first non-null image or null
        const firstImage = previewUrls.find(url => url !== null) || null;

        await db.execute(
            'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(previewUrls), firstImage, req.params.id, req.user.id]
        );

        res.json({ message: 'Preview deleted', preview_urls: previewUrls });
    } catch (err) {
        console.error('Preview delete error:', err);
        res.status(500).send(err.message);
    }
});

app.put('/api/projects/:id/preview/main', authenticateToken, async (req, res) => {
    const slot = parseInt(req.body.slot);
    if (isNaN(slot) || slot < 0 || slot > 2) return res.status(400).send('Invalid slot');

    try {
        const [projects] = await db.execute(
            'SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        let previewUrls = parseJSONField(projects[0].preview_urls, []);

        // Swap slot with 0
        const temp = previewUrls[0];
        previewUrls[0] = previewUrls[slot];
        previewUrls[slot] = temp;

        // Update DB
        await db.execute(
            'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(previewUrls), previewUrls[0], req.params.id, req.user.id]
        );

        res.json({ message: 'Main preview updated', preview_urls: previewUrls });
    } catch (err) {
        console.error('Main preview update error:', err);
        res.status(500).send(err.message);
    }
});

app.get('/api/projects/public', async (req, res) => {
    try {
        // Optimized query: Use LEFT JOINs instead of subqueries for better performance
        const [projects] = await db.execute(`
            SELECT 
                p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, 
                p.created_at, p.updated_at,
                u.username, u.nickname, u.avatar_url,
                COUNT(DISTINCT l.id) as likes_count,
                COUNT(DISTINCT c.id) as comments_count
            FROM projects p 
            INNER JOIN users u ON p.user_id = u.id
            LEFT JOIN likes l ON p.id = l.project_id
            LEFT JOIN comments c ON p.id = c.project_id
            WHERE p.is_public = TRUE 
            GROUP BY p.id, u.id
            ORDER BY p.updated_at DESC
        `);
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, SECRET_KEY);
                userId = decoded.id;
            } catch (e) { }
        }

        const [projects] = await db.execute(`
            SELECT p.*, u.username, u.nickname, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count
            FROM projects p 
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [req.params.id]);
        if (projects.length === 0) return res.status(404).send('Project not found');

        const project = projects[0];
        if (project.is_public || (userId && project.user_id === userId)) {
            res.json(project);
        } else {
            res.status(403).send('Unauthorized');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        // Optimized query with JOINs
        const [projects] = await db.execute(`
            SELECT 
                p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, 
                p.is_public, p.created_at, p.updated_at,
                COUNT(DISTINCT l.id) as likes_count,
                COUNT(DISTINCT c.id) as comments_count
            FROM projects p 
            LEFT JOIN likes l ON p.id = l.project_id
            LEFT JOIN comments c ON p.id = c.project_id
            WHERE p.user_id = ? 
            GROUP BY p.id
            ORDER BY p.updated_at DESC
        `, [req.user.id]);
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, data, is_public } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO projects (user_id, name, data, is_public) VALUES (?, ?, ?, ?)',
            [req.user.id, name, JSON.stringify(data), is_public || false]
        );

        if (is_public) {
            // Notify followers
            const [followers] = await db.execute('SELECT follower_id FROM followers WHERE following_id = ?', [req.user.id]);
            for (const follower of followers) {
                await db.execute(
                    'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                    [follower.follower_id, 'new_post', result.insertId, req.user.id]
                );
            }
        }

        res.status(201).json({ id: result.insertId, message: 'Project saved' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    const { name, data, is_public } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE projects SET name = ?, data = ?, is_public = ? WHERE id = ? AND user_id = ?',
            [name, JSON.stringify(data), is_public, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).send('Project not found or unauthorized');
        res.json({ message: 'Project updated' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [req.params.id]);
        if (projects.length === 0) return res.status(404).send('Project not found');

        const project = projects[0];
        if (project.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).send('Unauthorized');
        }

        await db.execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.patch('/api/projects/:id/visibility', authenticateToken, async (req, res) => {
    const { is_public } = req.body;
    try {
        let query = 'UPDATE projects SET is_public = ? WHERE id = ?';
        let params = [is_public, req.params.id];

        if (!req.user.is_admin) {
            query += ' AND user_id = ?';
            params.push(req.user.id);
        }

        const [result] = await db.execute(query, params);
        if (result.affectedRows === 0) return res.status(404).send('Project not found or unauthorized');
        res.json({ message: 'Visibility updated' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Comments Routes
app.get('/api/projects/:id/comments', async (req, res) => {
    try {
        const [comments] = await db.execute(`
            SELECT c.*, u.username, u.nickname, u.avatar_url,
            (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
            EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as is_liked
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.project_id = ?
            ORDER BY c.is_pinned DESC, c.created_at DESC
            `, [req.query.userId || 0, req.params.id]);
        res.json(comments);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/projects/:id/comments', authenticateToken, async (req, res) => {
    const { content, parent_id } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO comments (project_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
            [req.params.id, req.user.id, content, parent_id || null]
        );

        // Notification
        const [project] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [req.params.id]);
        if (project.length > 0 && project[0].user_id !== req.user.id) {
            await db.execute(
                'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                [project[0].user_id, 'comment', req.params.id, req.user.id]
            );
        }
        if (parent_id) {
            const [parent] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [parent_id]);
            if (parent.length > 0 && parent[0].user_id !== req.user.id) {
                await db.execute(
                    'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                    [parent[0].user_id, 'reply', req.params.id, req.user.id]
                );
            }
        }

        res.status(201).json({ message: 'Comment added', id: result.insertId });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
    try {
        const [comments] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
        if (comments.length === 0) return res.status(404).send('Comment not found');

        const comment = comments[0];
        if (comment.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).send('Unauthorized');
        }

        await db.execute('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/comments/:id/pin', authenticateToken, async (req, res) => {
    try {
        const [comments] = await db.execute('SELECT project_id FROM comments WHERE id = ?', [req.params.id]);
        if (comments.length === 0) return res.status(404).send('Comment not found');

        const [projects] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [comments[0].project_id]);
        if (projects.length === 0 || projects[0].user_id !== req.user.id) return res.status(403).send('Unauthorized');

        await db.execute('UPDATE comments SET is_pinned = NOT is_pinned WHERE id = ?', [req.params.id]);
        res.json({ message: 'Pin status updated' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/comments/:id/like', authenticateToken, async (req, res) => {
    try {
        const [existing] = await db.execute(
            'SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?',
            [req.user.id, req.params.id]
        );

        if (existing.length > 0) {
            await db.execute('DELETE FROM comment_likes WHERE id = ?', [existing[0].id]);
            res.json({ liked: false });
        } else {
            await db.execute(
                'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
                [req.user.id, req.params.id]
            );

            // Notification
            const [comment] = await db.execute('SELECT user_id, project_id FROM comments WHERE id = ?', [req.params.id]);
            if (comment.length > 0 && comment[0].user_id !== req.user.id) {
                await db.execute(
                    'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                    [comment[0].user_id, 'comment_like', comment[0].project_id, req.user.id]
                );
            }

            res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Likes Routes
app.post('/api/projects/:id/like', authenticateToken, async (req, res) => {
    try {
        console.log(`Like request received for project ${req.params.id} from user ${req.user.id} `);
        const [existing] = await db.execute(
            'SELECT id FROM likes WHERE user_id = ? AND project_id = ?',
            [req.user.id, req.params.id]
        );

        if (existing.length > 0) {
            await db.execute('DELETE FROM likes WHERE id = ?', [existing[0].id]);
            res.json({ liked: false });
        } else {
            await db.execute(
                'INSERT INTO likes (user_id, project_id) VALUES (?, ?)',
                [req.user.id, req.params.id]
            );

            // Notification
            const [project] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [req.params.id]);
            if (project.length > 0 && project[0].user_id !== req.user.id) {
                await db.execute(
                    'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                    [project[0].user_id, 'like', req.params.id, req.user.id]
                );
            }

            res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/projects/:id/like', authenticateToken, async (req, res) => {
    try {
        const [existing] = await db.execute(
            'SELECT id FROM likes WHERE user_id = ? AND project_id = ?',
            [req.user.id, req.params.id]
        );
        res.json({ liked: existing.length > 0 });
    } catch (err) {
        res.status(500).send(err.message);
    }
});



// Google Fonts
let fontsCache = null;
app.get('/api/fonts', async (req, res) => {
    if (fontsCache) return res.json(fontsCache);

    try {
        const apiKey = process.env.GOOGLE_FONTS_API_KEY;
        if (!apiKey) return res.status(500).send('Google Fonts API Key not configured');

        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`);
        if (!response.ok) throw new Error('Failed to fetch fonts');

        const data = await response.json();
        fontsCache = data.items.map(font => ({
            family: font.family,
            category: font.category,
            variants: font.variants,
            subsets: font.subsets
        }));
        res.json(fontsCache);
    } catch (err) {
        console.error('Fonts fetch error:', err);
        res.status(500).send(err.message);
    }
});

// Admin Routes
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    const { search } = req.query;
    try {
        let query = 'SELECT id, username, nickname, created_at, is_admin FROM users';
        let params = [];
        if (search) {
            query += ' WHERE username LIKE ? OR nickname LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }
        const [users] = await db.execute(query, params);
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/admin/projects', authenticateAdmin, async (req, res) => {
    const { search } = req.query;
    try {
        let query = `
            SELECT p.id, p.name, p.preview_url, p.preview_urls, p.created_at, p.updated_at, p.is_public, u.username, u.nickname, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count
            FROM projects p 
            JOIN users u ON p.user_id = u.id
        `;
        let params = [];
        if (search) {
            query += ' WHERE p.name LIKE ? OR u.username LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }
        query += ' ORDER BY p.created_at DESC';

        const [projects] = await db.execute(query, params);
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
    try {
        await db.execute('DELETE FROM projects WHERE user_id = ?', [req.params.id]);
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).send('User not found');
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
