import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgrespassword@localhost:5432/qwikshifts";
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

export default db;

