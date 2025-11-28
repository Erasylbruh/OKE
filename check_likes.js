import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: '127.0.0.1', // Force IPv4
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? (process.env.DB_PASSWORD === '' ? undefined : process.env.DB_PASSWORD) : 'password',
    database: process.env.DB_NAME || 'karaoke_animator',
    port: parseInt(process.env.DB_PORT || 3306),
    ...(process.env.DB_SSL === 'true' && {
        ssl: {
            rejectUnauthorized: false
        }
    })
};

async function checkLikes() {
    try {
        console.log('Connecting to database with config:', { ...dbConfig, password: '***' });
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        const [users] = await connection.execute('SELECT id, username FROM users');
        console.log('All Users:', JSON.stringify(users, null, 2));

        const [likes] = await connection.execute('SELECT * FROM likes');
        console.log('All Likes:', JSON.stringify(likes, null, 2));

        if (users.length > 0) {
            for (const user of users) {
                const [userLikes] = await connection.execute(`
                    SELECT p.id, p.name 
                    FROM projects p 
                    JOIN likes l ON p.id = l.project_id 
                    WHERE l.user_id = ?
                `, [user.id]);
                console.log(`User ${user.username} (ID: ${user.id}) has liked projects:`, userLikes.map(p => p.name));
            }
        }

        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkLikes();
