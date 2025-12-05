import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

export const register = async (req, res) => {
    let { username, password } = req.body;
    username = username.toLowerCase();

    const usernameRegex = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6,}$/;
    if (!usernameRegex.test(username)) {
        return res.status(400).send('Username must be at least 6 characters and contain both letters and digits.');
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@#$%&])[a-zA-Z\d@#$%&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).send('Password must be at least 8 characters and contain letters, digits, and a special character.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const login = async (req, res) => {
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
};