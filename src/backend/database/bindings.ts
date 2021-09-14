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
    "create table quotes (id integer primary key, quote text, author text, context text, source text)"
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
      "insert into quotes (quote, author, context, source) values (?, ?, ?, ?)"
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
    "create table if not exists users " +
      "(id integer primary key, name text, email text, identity_key text, secret_key_hash text, last_call integer)"
  )
  .run();

export { staticDatabase, userDatabase };
