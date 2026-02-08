import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../drizzle/schema";

// Lazy initialization to avoid build-time errors
let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: Pool | null = null;

function getDb(): NodePgDatabase<typeof schema> {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  _pool = new Pool({
    connectionString: databaseUrl,
  });

  _db = drizzle(_pool, { schema });
  return _db;
}

// Export as a getter proxy to delay initialization
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});