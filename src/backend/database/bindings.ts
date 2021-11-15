/**
 * Export SQLite database bindings.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import { config } from "dotenv";
config({ path: "./.env" });

import fs from "fs";

import parse from "csv-parse/lib/sync";
import sqlite from "better-sqlite3";

const BACKEND_DIST = "./dist/backend";

// First, we build the static database.
// This database holds the built database from the CSV files in the tables/ directory.
if (fs.existsSync(`${BACKEND_DIST}/database/static.db`)) {
  fs.unlinkSync(`${BACKEND_DIST}/database/static.db`);
}
const staticDatabase = sqlite(`${BACKEND_DIST}/database/static.db`);
staticDatabase.pragma("journal_mode = WAL");
staticDatabase
  .prepare(
    "CREATE TABLE quotes (quote_id INTEGER PRIMARY KEY, quote TEXT, author TEXT, context TEXT, source TEXT)"
  )
  .run();
const quotesTableCsv = fs.readFileSync(
  `${BACKEND_DIST}/tables/quotes.csv`,
  "utf8"
);
const quotesTable = parse(quotesTableCsv, {
  columns: true,
  skip_empty_lines: true,
});
for (const row of quotesTable) {
  staticDatabase
    .prepare(
      "INSERT INTO quotes (quote, author, context, source) VALUES (?, ?, ?, ?)"
    )
    .run(row.quote, row.author, row.context, row.source);
}

// Second, we initialize the user database.
// This is used to store user information, which is dynamically added during runtime.
let userDatabase: sqlite.Database;
if (process.env.NODE_ENV === "development") {
  userDatabase = sqlite(`${BACKEND_DIST}/database/users.test.db`);
} else {
  userDatabase = sqlite(`${BACKEND_DIST}/database/users.db`);
}
userDatabase.pragma("journal_mode = WAL");
userDatabase
  .prepare(
    "CREATE TABLE IF NOT EXISTS users " +
      "(user_id TEXT PRIMARY KEY NOT NULL, email TEXT, password_salted_hash TEXT, last_call INTEGER)"
  )
  .run();

export { staticDatabase, userDatabase };
