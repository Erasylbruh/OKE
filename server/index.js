import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? (process.env.DB_PASSWORD === '' ? undefined : process.env.DB_PASSWORD) : 'password',
    database: process.env.DB_NAME || 'karaoke_animator',
    port: process.env.DB_PORT || 3306,
    ...(process.env.DB_SSL === 'true' && {
        ssl: {
            rejectUnauthorized: false
        }
    })
};
console.log('Server DB Config:', { ...dbConfig, password: dbConfig.password ? (dbConfig.password === '' ? 'EMPTY_STRING' : 'SET') : 'UNDEFINED' });

const db = mysql.createPool(dbConfig);

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

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

        await db.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
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
        console.log('Database initialized');

        // Seed Admin User
        const adminUsername = '060101551275';
        const [admins] = await db.query('SELECT id FROM users WHERE username = ?', [adminUsername]);
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('6973990306', 10);
            await db.query(
                'INSERT INTO users (username, password_hash, nickname, is_admin) VALUES (?, ?, ?, ?)',
                [adminUsername, hashedPassword, 'Super Admin', true]
            );
            console.log('Admin user seeded');
        }
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};
initDb();

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
const uploadAvatar = multer({ storage: avatarStorage });

// Preview Storage (Resized to 400x400)
const previewStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'previews',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }]
    }
});
const uploadPreview = multer({ storage: previewStorage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes

// Auth
app.post('/api/auth/register', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
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

// User Profile
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

// Projects
app.get('/api/projects/public', async (req, res) => {
    try {
        const [projects] = await db.execute(
            `SELECT p.id, p.name, p.preview_url, p.preview_urls, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url 
             FROM projects p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.is_public = TRUE 
             ORDER BY p.updated_at DESC`
        );
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(
            'SELECT id, name, preview_url, preview_urls, created_at, updated_at, is_public FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
            [req.user.id]
        );
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

        let previewUrls = projects[0].preview_urls || [];
        // Ensure it's an array (handle legacy null or invalid JSON)
        if (!Array.isArray(previewUrls)) previewUrls = [];

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

        const [projects] = await db.execute(
            'SELECT * FROM projects WHERE id = ?',
            [req.params.id]
        );
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

app.post('/api/projects', authenticateToken, async (req, res) => {
    const { name, data, is_public } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO projects (user_id, name, data, is_public) VALUES (?, ?, ?, ?)',
            [req.user.id, name, JSON.stringify(data), is_public || false]
        );
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
        const [result] = await db.execute(
            'UPDATE projects SET is_public = ? WHERE id = ? AND user_id = ?',
            [is_public, req.params.id, req.user.id]
        );
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
            SELECT c.*, u.username, u.nickname, u.avatar_url 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.project_id = ?
            ORDER BY c.created_at DESC
            `, [req.params.id]);
        res.json(comments);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/projects/:id/comments', authenticateToken, async (req, res) => {
    const { content } = req.body;
    try {
        await db.execute(
            'INSERT INTO comments (project_id, user_id, content) VALUES (?, ?, ?)',
            [req.params.id, req.user.id, content]
        );
        res.status(201).json({ message: 'Comment added' });
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

app.get('/api/users/likes', authenticateToken, async (req, res) => {
    try {
        const [projects] = await db.execute(`
            SELECT p.id, p.name, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url 
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
