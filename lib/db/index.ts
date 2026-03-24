import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not defined. Please add it to your .env.local file."
  );
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create and export Drizzle database instance
export const db = drizzle(sql, { schema });

// Export schema for convenience
export * from "./schema";
