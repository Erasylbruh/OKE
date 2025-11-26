import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function setupDatabase() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '', // Try empty password first
    };

    console.log(`Attempting to connect to MySQL at ${config.host} as ${config.user}...`);

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected to MySQL server.');

        await connection.query('CREATE DATABASE IF NOT EXISTS karaoke_animator');
        console.log('Database "karaoke_animator" created or already exists.');

        await connection.query('USE karaoke_animator');

        const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        await connection.query(usersTable);
        console.log('Table "users" ready.');

        const projectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
        await connection.query(projectsTable);
        console.log('Table "projects" ready.');

        await connection.end();
        console.log('Setup complete!');
    } catch (err) {
        console.error('Setup failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('Error: Could not connect to MySQL. Please make sure the MySQL Server is running.');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Error: Access denied. Did you set a password for the "root" user during installation?');
            console.error('If so, please create a .env file in the project root with:');
            console.error('DB_PASSWORD=your_password');
        }
    }
}

setupDatabase();
