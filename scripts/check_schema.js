import db from '../server/db.js';

async function checkSchema() {
    try {
        const [rows] = await db.execute('DESCRIBE projects');
        console.log('Projects Table Schema:');
        console.table(rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

checkSchema();
