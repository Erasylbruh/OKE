import db from '../server/db.js';

async function checkUsers() {
    try {
        const [rows] = await db.execute('SELECT * FROM users');
        console.log('Registered Users:');
        console.table(rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

checkUsers();
