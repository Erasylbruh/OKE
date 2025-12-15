import db from '../server/db.js';

async function fixAndCheck() {
    try {
        // Fix Admin
        await db.execute("UPDATE users SET is_admin = 1 WHERE username = '060101551275'");
        console.log('Updated user 060101551275 to admin.');

        // Check Public Projects
        const [projects] = await db.execute('SELECT id, name, is_public FROM projects');
        console.log('Projects:');
        console.table(projects);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

fixAndCheck();
