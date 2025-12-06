import db from '../config/db.js';
import bcrypt from 'bcrypt';

export const getUserSettings = async (userId) => {
    const [users] = await db.execute('SELECT username, nickname, avatar_url, language, is_admin FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return users[0];
};

export const updateUserSettings = async (userId, { password, language }) => {
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
    }
    if (language) {
        await db.execute('UPDATE users SET language = ? WHERE id = ?', [language, userId]);
    }
    return { message: 'Settings updated' };
};

export const updateUserProfile = async (userId, { nickname, avatar_url }) => {
    await db.execute('UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?', [nickname, avatar_url, userId]);
    return { message: 'Profile updated', avatar_url };
};

export const deleteUser = async (targetId, currentUserId, isAdmin) => {
    if (parseInt(targetId) !== currentUserId && !isAdmin) {
        const error = new Error('Unauthorized');
        error.statusCode = 403;
        throw error;
    }

    await db.execute('DELETE FROM projects WHERE user_id = ?', [targetId]);
    const [result] = await db.execute('DELETE FROM users WHERE id = ?', [targetId]);

    if (result.affectedRows === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'User deleted' };
};

export const getUserLikes = async (userId) => {
    const [projects] = await db.execute(`
        SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.is_public, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url,
        (SELECT COUNT(*) FROM likes l2 WHERE l2.project_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
        FROM projects p 
        JOIN likes l ON p.id = l.project_id 
        JOIN users u ON p.user_id = u.id 
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC
    `, [userId]);
    return projects;
};

export const getPublicProfile = async (username, currentUserId) => {
    const [users] = await db.execute('SELECT id, username, nickname, avatar_url, created_at FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
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
    if (currentUserId) {
        const [check] = await db.execute('SELECT id FROM followers WHERE follower_id = ? AND following_id = ?', [currentUserId, user.id]);
        isFollowing = check.length > 0;
    }

    return {
        ...user,
        projects,
        followersCount: followers[0].count,
        followingCount: following[0].count,
        isFollowing
    };
};

export const followUser = async (followerId, followingId) => {
    if (parseInt(followingId) === followerId) {
        const error = new Error('Cannot follow yourself');
        error.statusCode = 400;
        throw error;
    }

    await db.execute(
        'INSERT IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
    );

    await db.execute(
        'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
        [followingId, 'follow', followerId, followerId]
    );

    return { message: 'Followed' };
};

export const unfollowUser = async (followerId, followingId) => {
    await db.execute(
        'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );
    return { message: 'Unfollowed' };
};

export const getFollowing = async (userId) => {
    const [users] = await db.execute(`
        SELECT u.id, u.username, u.nickname, u.avatar_url 
        FROM users u
        JOIN followers f ON u.id = f.following_id
        WHERE f.follower_id = ?
    `, [userId]);
    return users;
};
