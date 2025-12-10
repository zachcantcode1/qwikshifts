import { migrate } from 'drizzle-orm/postgres-js/migrator';
import db from './db';

async function run() {
    if (process.env.RUN_MIGRATIONS === 'true') {
        console.log('RUN_MIGRATIONS is true. Starting migrations...');
        try {
            await migrate(db, { migrationsFolder: './drizzle' });
            console.log('Migrations completed successfully.');
        } catch (err) {
            console.error('Migration failed:', err);
            process.exit(1);
        }
    } else {
        console.log('RUN_MIGRATIONS is not true. Skipping migrations.');
    }
}

run().then(() => {
    process.exit(0);
});
