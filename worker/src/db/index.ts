import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

export type DB = D1Database;
export type AppDB = ReturnType<typeof drizzle<typeof schema>>;

export function createDB(d1: D1Database) {
  return drizzle(d1, { schema });
}
