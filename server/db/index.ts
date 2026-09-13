import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

const client = postgres(process.env.DATABASE_URL as string, { max: 10 });

export const db = drizzle(client, {
  schema: { ...schema, ...authSchema }
});
