import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { config } from '../config/env.js';

export const registerUser = async (username, password) => {
    username = username.toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await db.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );
        return { id: result.insertId, username };
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            const error = new Error('Username already exists');
            error.statusCode = 409;
            throw error;
        }
        throw err;
    }
};

export const loginUser = async (username, password) => {
    const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }

    if (await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            config.jwtSecret
        );
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin,
                nickname: user.nickname,
                avatar_url: user.avatar_url
            }
        };
    } else {
        const error = new Error('Invalid credentials');
        error.statusCode = 401;
        throw error;
    }
};
