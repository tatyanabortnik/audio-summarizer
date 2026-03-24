import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function runMigrations() {
  console.log('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.log('✓ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
