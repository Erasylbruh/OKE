import db from '../config/db.js';

export const getUsers = async (req, res) => {
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
};

export const getProjects = async (req, res) => {
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
};

export const deleteUser = async (req, res) => {
    try {
        await db.execute('DELETE FROM projects WHERE user_id = ?', [req.params.id]);
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).send('User not found');
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};