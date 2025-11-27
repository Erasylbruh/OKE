import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? (process.env.DB_PASSWORD === '' ? undefined : process.env.DB_PASSWORD) : 'password',
    database: process.env.DB_NAME || 'karaoke_animator',
    port: process.env.DB_PORT || 3306,
    // ssl: { rejectUnauthorized: false } // Commented out for local test
};

console.log('Testing connection with:', { ...dbConfig, password: dbConfig.password ? '***' : 'EMPTY' });

async function testConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Successfully connected to database!');
        await connection.end();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

testConnection();
