// db-setup: applies db/schema.sql to the Neon database, then prints the rows.
// Usage: npm run db:setup
// Raw SQL only — no ORM. The backend is the one that computes AVG/COUNT (M3);
// this script just creates facts.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

// 1. Read the connection string from .env.local (never hardcoded in code).
const envText = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
const urlLine = envText
  .split('\n')
  .find((line) => line.startsWith('DATABASE_URL='));
const connectionString = urlLine.slice('DATABASE_URL='.length).trim();

const sql = neon(connectionString);

// Run a plain SQL string. (This driver version requires sql.query for
// dynamic/plain-text queries; tagged templates are only for known values.)
const run = (text) => sql.query(text);

// 2. Sanity check: prove the connection works before touching anything.
await run('SELECT 1');
console.log('Connected to Neon.');

// 3. Apply the schema. Split the file into statements, strip comment lines,
//    and run them one at a time (the HTTP driver takes one statement per call).
const schemaText = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');
const statements = schemaText
  .split(';')
  .map((chunk) =>
    chunk
      .split('\n')
      .filter((l) => !l.trim().startsWith('--'))
      .join('\n')
      .trim()
  )
  .filter((chunk) => chunk.length > 0);

for (const statement of statements) {
  await run(statement);
}
console.log(`Schema applied (${statements.length} statements).`);

// 4. Show the rows, so a human can verify the facts exist.
console.log('\nrestaurants:');
console.table(await run('SELECT * FROM restaurants ORDER BY id'));
console.log('reviews:');
console.table(
  await run('SELECT id, restaurant_id, rating, comment, created_at FROM reviews ORDER BY id')
);
