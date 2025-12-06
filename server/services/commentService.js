import db from '../config/db.js';

export const getProjectComments = async (projectId, currentUserId) => {
    const [comments] = await db.execute(`
        SELECT c.*, u.username, u.nickname, u.avatar_url,
        (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as likes_count,
        EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as is_liked
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.project_id = ? 
        ORDER BY c.is_pinned DESC, c.created_at DESC
    `, [currentUserId || null, projectId]);
    return comments;
};

export const addComment = async (projectId, userId, { content, parent_id }) => {
    const [result] = await db.execute(
        'INSERT INTO comments (project_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
        [projectId, userId, content, parent_id || null]
    );

    // Notify project owner if it's not their own comment
    // First get project owner
    const [projects] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [projectId]);
    if (projects.length > 0) {
        const projectOwnerId = projects[0].user_id;
        if (projectOwnerId !== userId) {
            await db.execute(
                'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                [projectOwnerId, 'comment', result.insertId, userId]
            );
        }
    }

    // Notify parent comment owner if reply
    if (parent_id) {
        const [parents] = await db.execute('SELECT user_id FROM comments WHERE id = ?', [parent_id]);
        if (parents.length > 0) {
            const parentOwnerId = parents[0].user_id;
            if (parentOwnerId !== userId) { // Avoid double notify if replying to self (logic might need refinement but simple check is good)
                await db.execute(
                    'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                    [parentOwnerId, 'reply', result.insertId, userId]
                );
            }
        }
    }

    return { id: result.insertId, message: 'Comment added' };
};

export const deleteComment = async (commentId, userId, isAdmin) => {
    let query = 'DELETE FROM comments WHERE id = ?';
    let params = [commentId];

    if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(userId);
    }

    const [result] = await db.execute(query, params);
    if (result.affectedRows === 0) {
        const error = new Error('Comment not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Comment deleted' };
};

export const toggleLike = async (commentId, userId) => {
    try {
        await db.execute(
            'INSERT INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
            [userId, commentId]
        );
        return { message: 'Comment liked' };
    } catch (e) {
        // If dup entry, remove like (toggle) -> wait, logic in original code was not shown fully but likely toggle or separate endpoints.
        // Request says "POST /api/comments/:id/like" and "DELETE". So separated.
        // This function will just add.
        if (e.code === 'ER_DUP_ENTRY') {
            const error = new Error('Already liked');
            error.statusCode = 409;
            throw error;
        }
        throw e;
    }
};

export const removeLike = async (commentId, userId) => {
    await db.execute(
        'DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?',
        [userId, commentId]
    );
    return { message: 'Like removed' };
};

export const pinComment = async (commentId, userId, projectId) => {
    // Check if user owns the project
    const [projects] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0 || projects[0].user_id !== userId) {
        const error = new Error('Unauthorized');
        error.statusCode = 403;
        throw error;
    }

    // First unpin all in project (if single pin policy, assuming logic from typical apps, but let's check. 
    // Original code was just PATCH pin. I will implement simple toggle or set.
    // Let's assume passed body has is_pinned.
    // Wait, let's look at requirements. Just "PATCH /api/comments/:id/pin".
    // I will implementation toggle logic here or strict set.
    // Let's go with strict set from controller.
    return { message: 'Pin logic handled in controller/service' };
};

export const setPinStatus = async (commentId, userId, isPinned) => {
    // We need to know the project ID to check ownership.
    // Query comment to get project_id
    const [comments] = await db.execute('SELECT project_id FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0) {
        const error = new Error('Comment not found');
        error.statusCode = 404;
        throw error;
    }
    const projectId = comments[0].project_id;

    const [projects] = await db.execute('SELECT user_id FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0 || projects[0].user_id !== userId) {
        const error = new Error('Unauthorized');
        error.statusCode = 403;
        throw error;
    }

    await db.execute('UPDATE comments SET is_pinned = ? WHERE id = ?', [isPinned, commentId]);
    return { message: isPinned ? 'Comment pinned' : 'Comment unpinned' };
};
