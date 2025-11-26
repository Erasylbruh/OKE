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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'karaoke_animator',
    port: process.env.DB_PORT || 3306,
    ssl: {
        rejectUnauthorized: false
    }
});

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
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
        console.log('Database initialized');
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
        // console.log('User authenticated:', user);
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        // console.log('Checking admin status for:', req.user);
        if (req.user && (req.user.is_admin || req.user.is_admin === 1)) {
            next();
        } else {
            console.log('Admin check failed for user:', req.user.id);
            res.sendStatus(403);
        }
    });
};

// ... (skip to routes)

app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`Attempting to delete comment ${req.params.id} by user ${req.user.id}`);
        const [comments] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);
        if (comments.length === 0) return res.status(404).send('Comment not found');

        const comment = comments[0];
        console.log(`Comment owner: ${comment.user_id}, Request user: ${req.user.id}, Is Admin: ${req.user.is_admin}`);

        // Use loose equality or Number() for ID check
        if (Number(comment.user_id) !== Number(req.user.id) && !req.user.is_admin) {
            console.log('Unauthorized comment delete attempt');
            return res.status(403).send('Unauthorized');
        }

        await db.execute('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('Delete comment error:', err);
        res.status(500).send(err.message);
    }
});

app.get('/api/admin/projects', authenticateAdmin, async (req, res) => {
    const { search } = req.query;
    try {
        console.log('Fetching admin projects, search:', search);
        let query = `
            SELECT p.id, p.name, p.created_at, u.username 
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
        console.log(`Found ${projects.length} projects`);
        res.json(projects);
    } catch (err) {
        console.error('Admin projects error:', err);
        res.status(500).send(err.message);
    }
});

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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
app.put('/api/users/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
    const { nickname } = req.body;
    let avatar_url = req.body.avatar_url;

    if (req.file) {
        avatar_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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
            `SELECT p.id, p.name, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url 
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
            'SELECT id, name, created_at, updated_at, is_public FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
            [req.user.id]
        );
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

app.get('/api/admin/projects', authenticateAdmin, async (req, res) => {
    const { search } = req.query;
    try {
        let query = `
            SELECT p.id, p.name, p.created_at, u.username 
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
