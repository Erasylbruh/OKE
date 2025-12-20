import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run database migrations
 * Executes SQL files in the migrations directory in order
 */
export const runMigrations = async (db) => {
    const migrationsDir = path.join(__dirname, 'migrations');

    // Create migrations table if it doesn't exist
    await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
        console.log('📂 No migrations directory found, skipping migrations');
        return;
    }

    // Get all SQL files
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('📂 No migration files found');
        return;
    }

    console.log(`\n🔄 Running database migrations...\n`);

    for (const file of files) {
        // Check if migration already executed
        const [existing] = await db.query(
            'SELECT id FROM migrations WHERE filename = ?',
            [file]
        );

        if (existing.length > 0) {
            console.log(`⏭️  Skipping ${file} (already executed)`);
            continue;
        }

        // Read and execute migration
        const filepath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filepath, 'utf8');

        try {
            // Split by semicolons and execute each statement
            const statements = sql.split(';').filter(s => s.trim());

            for (const statement of statements) {
                if (statement.trim()) {
                    await db.query(statement);
                }
            }

            // Mark as executed
            await db.query(
                'INSERT INTO migrations (filename) VALUES (?)',
                [file]
            );

            console.log(`✅ Executed ${file}`);
        } catch (err) {
            console.error(`❌ Error executing ${file}:`, err.message);
            throw err;
        }
    }

    console.log(`\n✅ All migrations completed\n`);
};

export default runMigrations;
