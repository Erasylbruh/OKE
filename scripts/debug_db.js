import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    passwordLength: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0,
    passwordValue: process.env.DB_PASSWORD === '' ? 'EMPTY_STRING' : (process.env.DB_PASSWORD ? 'SET' : 'UNDEFINED'),
    database: process.env.DB_NAME
});

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME || 'karaoke_animator'
};

console.log('Resolved Config:', {
    ...dbConfig,
    password: dbConfig.password === '' ? 'EMPTY_STRING' : (dbConfig.password ? 'SET' : 'UNDEFINED')
});

async function testConnection() {
    let pool;
    try {
        console.log('Attempting connection via POOL...');
        pool = mysql.createPool(dbConfig);

        console.log('Testing query...');
        const [rows] = await pool.query('SELECT 1 as val');
        console.log('Query result:', rows);

        console.log('Testing execute...');
        const [rows2] = await pool.execute('SELECT 1 as val');
        console.log('Execute result:', rows2);

    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        if (pool) await pool.end();
    }
}

testConnection();
