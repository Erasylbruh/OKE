import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? (process.env.DB_PASSWORD === '' ? undefined : process.env.DB_PASSWORD) : 'password',
    database: process.env.DB_NAME || 'karaoke_animator',
    port: process.env.DB_PORT || 3306,
    ...(process.env.DB_SSL === 'true' && {
        ssl: {
            rejectUnauthorized: false
        }
    })
};

async function checkLikes() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        const [users] = await connection.execute('SELECT id, username FROM users');
        console.log('Users:', users);

        const [projects] = await connection.execute('SELECT id, name, user_id FROM projects');
        console.log('Projects:', projects);

        const [likes] = await connection.execute('SELECT * FROM likes');
        console.log('Likes:', likes);

        if (likes.length > 0) {
            const userId = likes[0].user_id;
            console.log(`Checking likes for user ${userId}...`);
            const [userLikes] = await connection.execute(`
                SELECT p.id, p.name, u.username 
                FROM projects p 
                JOIN likes l ON p.id = l.project_id 
                JOIN users u ON p.user_id = u.id 
                WHERE l.user_id = ?
            `, [userId]);
            console.log('User Likes Query Result:', userLikes);
        }

        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkLikes();
