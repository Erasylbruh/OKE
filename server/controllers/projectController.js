import db from '../config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const getFollowingProjects = async (req, res) => {
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
};

export const getPublicProjects = async (req, res) => {
    try {
        const [projects] = await db.execute(`
            SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url,
            (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
            FROM projects p 
            JOIN users u ON p.user_id = u.id 
            WHERE p.is_public = TRUE 
            ORDER BY p.updated_at DESC
        `);
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const getProjectById = async (req, res) => {
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
};

export const getUserProjects = async (req, res) => {
    try {
        const [projects] = await db.execute(`
            SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.is_public, p.created_at, p.updated_at,
            (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
            FROM projects p 
            WHERE p.user_id = ? 
            ORDER BY p.updated_at DESC
        `, [req.user.id]);
        res.json(projects);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const createProject = async (req, res) => {
    const { name, data, is_public } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO projects (user_id, name, data, is_public) VALUES (?, ?, ?, ?)',
            [req.user.id, name, JSON.stringify(data), is_public || false]
        );

        if (is_public) {
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
};

export const updateProject = async (req, res) => {
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
};

export const deleteProject = async (req, res) => {
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
};

export const updateVisibility = async (req, res) => {
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
};

export const uploadPreview = async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    const slot = parseInt(req.body.slot) || 0;
    try {
        const preview_url = req.file.path;
        const [projects] = await db.execute('SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        let previewUrls = projects[0].preview_urls || [];
        if (!Array.isArray(previewUrls)) previewUrls = [];
        previewUrls[slot] = preview_url;
        previewUrls = previewUrls.slice(0, 3);

        await db.execute(
            'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(previewUrls), previewUrls[0], req.params.id, req.user.id]
        );
        res.json({ message: 'Preview updated', preview_urls: previewUrls });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const deletePreview = async (req, res) => {
    const slot = parseInt(req.params.slot);
    if (isNaN(slot) || slot < 0 || slot > 2) return res.status(400).send('Invalid slot');
    try {
        const [projects] = await db.execute('SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        let previewUrls = projects[0].preview_urls || [];
        if (!Array.isArray(previewUrls)) previewUrls = [];
        previewUrls[slot] = null;
        const firstImage = previewUrls.find(url => url !== null) || null;

        await db.execute(
            'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(previewUrls), firstImage, req.params.id, req.user.id]
        );
        res.json({ message: 'Preview deleted', preview_urls: previewUrls });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const setMainPreview = async (req, res) => {
    const slot = parseInt(req.body.slot);
    if (isNaN(slot) || slot < 0 || slot > 2) return res.status(400).send('Invalid slot');
    try {
        const [projects] = await db.execute('SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        let previewUrls = projects[0].preview_urls || [];
        if (!Array.isArray(previewUrls)) previewUrls = [];
        const temp = previewUrls[0];
        previewUrls[0] = previewUrls[slot];
        previewUrls[slot] = temp;

        await db.execute(
            'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
            [JSON.stringify(previewUrls), previewUrls[0], req.params.id, req.user.id]
        );
        res.json({ message: 'Main preview updated', preview_urls: previewUrls });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const uploadAudio = async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');
    try {
        const audio_url = req.file.path;
        const [projects] = await db.execute('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        await db.execute('UPDATE projects SET audio_url = ? WHERE id = ?', [audio_url, req.params.id]);
        res.json({ message: 'Audio uploaded', audio_url });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const deleteAudio = async (req, res) => {
    try {
        const [projects] = await db.execute('SELECT id FROM projects WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (projects.length === 0) return res.status(404).send('Project not found or unauthorized');

        await db.execute('UPDATE projects SET audio_url = NULL WHERE id = ?', [req.params.id]);
        res.json({ message: 'Audio deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const likeProject = async (req, res) => {
    try {
        const [existing] = await db.execute('SELECT id FROM likes WHERE user_id = ? AND project_id = ?', [req.user.id, req.params.id]);
        if (existing.length > 0) {
            await db.execute('DELETE FROM likes WHERE id = ?', [existing[0].id]);
            res.json({ liked: false });
        } else {
            await db.execute('INSERT INTO likes (user_id, project_id) VALUES (?, ?)', [req.user.id, req.params.id]);
            const [project] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [req.params.id]);
            if (project.length > 0 && project[0].user_id !== req.user.id) {
                await db.execute('INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)', [project[0].user_id, 'like', req.params.id, req.user.id]);
            }
            res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const checkLikeStatus = async (req, res) => {
    try {
        const [existing] = await db.execute('SELECT id FROM likes WHERE user_id = ? AND project_id = ?', [req.user.id, req.params.id]);
        res.json({ liked: existing.length > 0 });
    } catch (err) {
        res.status(500).send(err.message);
    }
};