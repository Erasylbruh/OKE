import db from '../config/db.js';

export const getComments = async (req, res) => {
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
};

export const addComment = async (req, res) => {
    const { content, parent_id } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO comments (project_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
            [req.params.id, req.user.id, content, parent_id || null]
        );

        const [project] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [req.params.id]);
        if (project.length > 0 && project[0].user_id !== req.user.id) {
            await db.execute('INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)', [project[0].user_id, 'comment', req.params.id, req.user.id]);
        }
        if (parent_id) {
            const [parent] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [parent_id]);
            if (parent.length > 0 && parent[0].user_id !== req.user.id) {
                await db.execute('INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)', [parent[0].user_id, 'reply', req.params.id, req.user.id]);
            }
        }
        res.status(201).json({ message: 'Comment added', id: result.insertId });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const deleteComment = async (req, res) => {
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
};

export const togglePinComment = async (req, res) => {
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
};

export const likeComment = async (req, res) => {
    try {
        const [existing] = await db.execute('SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?', [req.user.id, req.params.id]);
        if (existing.length > 0) {
            await db.execute('DELETE FROM comment_likes WHERE id = ?', [existing[0].id]);
            res.json({ liked: false });
        } else {
            await db.execute('INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)', [req.user.id, req.params.id]);
            const [comment] = await db.execute('SELECT user_id, project_id FROM comments WHERE id = ?', [req.params.id]);
            if (comment.length > 0 && comment[0].user_id !== req.user.id) {
                await db.execute('INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)', [comment[0].user_id, 'comment_like', comment[0].project_id, req.user.id]);
            }
            res.json({ liked: true });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
};