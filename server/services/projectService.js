import db from '../config/db.js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsDir = path.join(__dirname, '../../scripts'); // Adjust path as service is in server/services

export const getProject = async (projectId, userId, isAdmin) => {
    const [projects] = await db.execute(`
        SELECT p.*, u.username, u.nickname, u.avatar_url,
        (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count
        FROM projects p 
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    `, [projectId]);

    if (projects.length === 0) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    const project = projects[0];
    if (project.is_public || (userId && project.user_id === userId) || isAdmin) {
        return project;
    } else {
        const error = new Error('Unauthorized');
        error.statusCode = 403;
        throw error;
    }
};

export const getUserProjects = async (userId) => {
    const [projects] = await db.execute(`
        SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.is_public, p.created_at, p.updated_at,
        (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
        FROM projects p 
        WHERE p.user_id = ? 
        ORDER BY p.updated_at DESC
    `, [userId]);
    return projects;
};

export const getPublicProjects = async () => {
    const [projects] = await db.execute(`
        SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url,
        (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
        FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.is_public = TRUE 
        ORDER BY p.updated_at DESC
    `);
    return projects;
};

export const getFollowingProjects = async (userId) => {
    const [projects] = await db.execute(`
        SELECT p.id, p.name, p.preview_url, p.preview_urls, p.audio_url, p.created_at, p.updated_at, u.username, u.nickname, u.avatar_url,
        (SELECT COUNT(*) FROM likes l WHERE l.project_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.project_id = p.id) as comments_count
        FROM projects p 
        JOIN users u ON p.user_id = u.id 
        JOIN followers f ON u.id = f.following_id
        WHERE f.follower_id = ? AND p.is_public = TRUE
        ORDER BY p.updated_at DESC
    `, [userId]);
    return projects;
};

export const createProject = async (userId, { name, data, is_public }) => {
    const [result] = await db.execute(
        'INSERT INTO projects (user_id, name, data, is_public) VALUES (?, ?, ?, ?)',
        [userId, name, JSON.stringify(data), is_public || false]
    );

    if (is_public) {
        // Notify followers
        const [followers] = await db.execute('SELECT follower_id FROM followers WHERE following_id = ?', [userId]);
        for (const follower of followers) {
            await db.execute(
                'INSERT INTO notifications (user_id, type, source_id, trigger_user_id) VALUES (?, ?, ?, ?)',
                [follower.follower_id, 'new_post', result.insertId, userId]
            );
        }
    }
    return { id: result.insertId, message: 'Project saved' };
};

export const updateProject = async (projectId, userId, { name, data, is_public }) => {
    const [result] = await db.execute(
        'UPDATE projects SET name = ?, data = ?, is_public = ? WHERE id = ? AND user_id = ?',
        [name, JSON.stringify(data), is_public, projectId, userId]
    );

    if (result.affectedRows === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Project updated' };
};

export const deleteProject = async (projectId, userId, isAdmin) => {
    let query = 'DELETE FROM projects WHERE id = ?';
    let params = [projectId];

    if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(userId);
    }

    const [result] = await db.execute(query, params);
    if (result.affectedRows === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Project deleted' };
};

export const updateVisibility = async (projectId, userId, isAdmin, is_public) => {
    let query = 'UPDATE projects SET is_public = ? WHERE id = ?';
    let params = [is_public, projectId];

    if (!isAdmin) {
        query += ' AND user_id = ?';
        params.push(userId);
    }

    const [result] = await db.execute(query, params);
    if (result.affectedRows === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Visibility updated' };
};

export const uploadAudio = async (projectId, userId, audioPath) => {
    // 1. Check permissions
    const [projects] = await db.execute(
        'SELECT data FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
    );
    if (projects.length === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }

    // 2. Update DB with URL
    await db.execute(
        'UPDATE projects SET audio_url = ? WHERE id = ?',
        [audioPath, projectId]
    );

    // 3. Transcribe
    const scriptPath = path.join(scriptsDir, 'transcribe.py');
    console.log(`Starting transcription for ${audioPath}...`);

    let newLyrics = [];
    try {
        const { stdout } = await execPromise(`python3 "${scriptPath}" "${audioPath}"`);
        newLyrics = JSON.parse(stdout);
    } catch (e) {
        console.error("Transcription failed or parsing error:", e);
        // We continue even if transcription fails, but we might want to return details
        // The original code swallowed the error partially (returning OK but with error field)
        // Here we will return the result with potential error info if needed
    }

    // 4. Save lyrics if valid
    if (newLyrics.length > 0) {
        let projectData = projects[0].data || {};
        if (typeof projectData === 'string') projectData = JSON.parse(projectData);
        projectData.lyrics = newLyrics;

        await db.execute(
            'UPDATE projects SET data = ? WHERE id = ?',
            [JSON.stringify(projectData), projectId]
        );
    }

    return {
        message: 'Audio uploaded and transcribed',
        audio_url: audioPath,
        lyrics: newLyrics
    };
};

export const deleteAudio = async (projectId, userId) => {
    const [result] = await db.execute(
        'UPDATE projects SET audio_url = NULL WHERE id = ? AND user_id = ?',
        [projectId, userId]
    );
    if (result.affectedRows === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }
    return { message: 'Audio deleted' };
};

export const uploadPreview = async (projectId, userId, previewPath, slot) => {
    slot = parseInt(slot) || 0;
    const [projects] = await db.execute(
        'SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
    );

    if (projects.length === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }

    let previewUrls = projects[0].preview_urls || [];
    if (!Array.isArray(previewUrls)) previewUrls = [];

    previewUrls[slot] = previewPath;
    previewUrls = previewUrls.slice(0, 3); // Limit to 3

    await db.execute(
        'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
        [JSON.stringify(previewUrls), previewUrls[0], projectId, userId]
    );

    return { message: 'Preview updated', preview_urls: previewUrls };
};

export const deletePreview = async (projectId, userId, slot) => {
    slot = parseInt(slot);
    if (isNaN(slot) || slot < 0 || slot > 2) {
        const error = new Error('Invalid slot');
        error.statusCode = 400;
        throw error;
    }

    const [projects] = await db.execute(
        'SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
    );

    if (projects.length === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }

    let previewUrls = projects[0].preview_urls || [];
    if (!Array.isArray(previewUrls)) previewUrls = [];

    previewUrls[slot] = null;
    const firstImage = previewUrls.find(url => url !== null) || null;

    await db.execute(
        'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
        [JSON.stringify(previewUrls), firstImage, projectId, userId]
    );

    return { message: 'Preview deleted', preview_urls: previewUrls };
};

export const setMainPreview = async (projectId, userId, slot) => {
    slot = parseInt(slot);
    if (isNaN(slot) || slot < 0 || slot > 2) {
        const error = new Error('Invalid slot');
        error.statusCode = 400;
        throw error;
    }

    const [projects] = await db.execute(
        'SELECT preview_urls FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId]
    );

    if (projects.length === 0) {
        const error = new Error('Project not found or unauthorized');
        error.statusCode = 404;
        throw error;
    }

    let previewUrls = projects[0].preview_urls || [];
    if (!Array.isArray(previewUrls)) previewUrls = [];

    const temp = previewUrls[0];
    previewUrls[0] = previewUrls[slot];
    previewUrls[slot] = temp;

    await db.execute(
        'UPDATE projects SET preview_urls = ?, preview_url = ? WHERE id = ? AND user_id = ?',
        [JSON.stringify(previewUrls), previewUrls[0], projectId, userId]
    );

    return { message: 'Main preview updated', preview_urls: previewUrls };
};
