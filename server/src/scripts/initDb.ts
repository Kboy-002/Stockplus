import "dotenv/config";
import { initDb, pool } from "../db.js";

async function main() {
  await initDb();
  console.log("Database tables and category seed are ready.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
