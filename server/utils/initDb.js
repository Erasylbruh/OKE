import db from '../config/db.js';
import bcrypt from 'bcrypt';

const initDb = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                nickname VARCHAR(255),
                avatar_url VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // ... (Добавление колонки language)
        try {
            await db.query("ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en'");
        } catch (e) { }

        await db.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                data JSON,
                is_public BOOLEAN DEFAULT FALSE,
                preview_url VARCHAR(255),
                preview_urls JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Migration checks for projects
        try { await db.query('ALTER TABLE projects ADD COLUMN preview_urls JSON'); } catch (e) {}
        try { await db.query('ALTER TABLE projects ADD COLUMN preview_url VARCHAR(255)'); } catch (e) {}
        try { await db.query('ALTER TABLE projects ADD COLUMN audio_url VARCHAR(255)'); } catch (e) {}

        await db.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                parent_id INT DEFAULT NULL,
                is_pinned BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
            )
        `);

        // Migration checks for comments
        try { await db.query("ALTER TABLE comments ADD COLUMN parent_id INT DEFAULT NULL"); } catch (e) { }
        try { await db.query("ALTER TABLE comments ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE"); } catch (e) { }
        try { await db.query("ALTER TABLE comments ADD CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE"); } catch (e) { }

        await db.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                project_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (user_id, project_id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS followers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                follower_id INT NOT NULL,
                following_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_follow (follower_id, following_id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS comment_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                comment_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
                UNIQUE KEY unique_comment_like (user_id, comment_id)
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type VARCHAR(50) NOT NULL,
                source_id INT NOT NULL,
                trigger_user_id INT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (trigger_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Database initialized');

        // Seed Admin User
        const adminUsername = '060101551275';
        const [admins] = await db.query('SELECT id FROM users WHERE username = ?', [adminUsername]);
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('6973990306', 10);
            await db.query(
                'INSERT INTO users (username, password_hash, nickname, is_admin) VALUES (?, ?, ?, ?)',
                [adminUsername, hashedPassword, 'Super Admin', true]
            );
            console.log('Admin user seeded');
        }
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

export default initDb;