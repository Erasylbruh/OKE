import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const getSettings = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT username, nickname, avatar_url, language, is_admin FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).send('User not found');
        res.json(users[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const updateSettings = async (req, res) => {
    const { password, language } = req.body;
    try {
        if (password) {
            const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&])[a-zA-Z\d@#$%&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).send('Password validation failed.');
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
};

export const updateProfile = async (req, res) => {
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
};

export const deleteUser = async (req, res) => {
    try {
        if (parseInt(req.params.id) !== req.user.id && !req.user.is_admin) {
            return res.status(403).send('Unauthorized');
        }
        await db.execute('DELETE FROM projects WHERE user_id = ?', [req.params.id]);
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).send('User not found');
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const getLikedProjects = async (req, res) => {
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
};

export const getUserProfile = async (req, res) => {
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
};

export const followUser = async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) return res.status(400).send('Cannot follow yourself');
        await db.execute('INSERT IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)', [req.user.id, req.params.id]);
        await db.execute('INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)', [req.params.id, 'follow', req.user.id, req.user.id]);
        res.json({ message: 'Followed' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const unfollowUser = async (req, res) => {
    try {
        await db.execute('DELETE FROM followers WHERE follower_id = ? AND following_id = ?', [req.user.id, req.params.id]);
        res.json({ message: 'Unfollowed' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const getFollowing = async (req, res) => {
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
};