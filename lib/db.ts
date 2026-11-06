// One place to open the database connection.
// The address comes from .env.local (loaded automatically by Next.js) —
// it is never written in code, because it contains the password.
import { neon } from '@neondatabase/serverless';

export function db() {
  return neon(process.env.DATABASE_URL!);
}
