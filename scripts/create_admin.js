import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME || 'karaoke_animator'
};

async function createAdmin() {
    let connection;
    try {
        console.log('Connecting to DB...', { ...dbConfig, password: dbConfig.password ? '***' : 'EMPTY' });
        connection = await mysql.createConnection(dbConfig);

        const username = '060101551275';
        const rawPassword = '6973990306';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // Check if user exists
        const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length > 0) {
            console.log('User exists, updating password and admin status...');
            await connection.execute(
                'UPDATE users SET password_hash = ?, is_admin = 1 WHERE username = ?',
                [hashedPassword, username]
            );
        } else {
            console.log('Creating new admin user...');
            await connection.execute(
                'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)',
                [username, hashedPassword]
            );
        }

        console.log('Admin user configured successfully.');

    } catch (err) {
        console.error('Failed to configure admin:', err);
    } finally {
        if (connection) await connection.end();
    }
}

createAdmin();
