import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? (process.env.DB_PASSWORD === '' ? undefined : process.env.DB_PASSWORD) : 'password',
    database: process.env.DB_NAME || 'karaoke_animator',
    port: process.env.DB_PORT || 3306,
    ...(process.env.DB_SSL === 'true' && {
        ssl: {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        }
    }),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
