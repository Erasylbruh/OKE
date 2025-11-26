import db from '../server/db.js';

async function updateSchema() {
    console.log('Updating database schema...');
    try {
        // Add columns to users table
        try {
            await db.query('ALTER TABLE users ADD COLUMN nickname VARCHAR(255)');
            console.log('Added nickname to users');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding nickname:', e.message);
        }

        try {
            await db.query('ALTER TABLE users ADD COLUMN avatar_url TEXT');
            console.log('Added avatar_url to users');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding avatar_url:', e.message);
        }

        try {
            await db.query('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE');
            console.log('Added is_admin to users');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding is_admin:', e.message);
        }

        // Add columns to projects table
        try {
            await db.query('ALTER TABLE projects ADD COLUMN is_public BOOLEAN DEFAULT FALSE');
            console.log('Added is_public to projects');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding is_public:', e.message);
        }

        console.log('Schema update complete.');
    } catch (err) {
        console.error('Schema update failed:', err);
    } finally {
        process.exit();
    }
}

updateSchema();
