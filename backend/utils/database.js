/**
 * Export SQLite database bindings.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const fs = require("fs");

const parse = require("csv-parse/lib/sync");
const sqlite = require("better-sqlite3");

// First, we build the static database.
// This database holds the built database from the CSV files in the tables/ directory.
if (fs.existsSync("../static.db")) {
  fs.unlinkSync("../static.db");
}
const staticDatabase = sqlite("../static.db");
staticDatabase.pragma("journal_mode = WAL");
staticDatabase
  .prepare(
    "create table quotes (id integer primary key, quote text, author text, context text, source text)"
  )
  .run();
let quotesTable = fs.readFileSync("../tables/quotes.csv", "utf8");
quotesTable = parse(quotesTable, { columns: true, skip_empty_lines: true });
for (const row of quotesTable) {
  staticDatabase
    .prepare(
      "insert into quotes (quote, author, context, source) values (?, ?, ?, ?)"
    )
    .run(row.quote, row.author, row.context, row.source);
}

// Second, we initialize the dynamic database.
// This is used to store user information, which is dynamically-generated added runtime.
const dynamicDatabase = sqlite("../dynamic.db");
dynamicDatabase.pragma("journal_mode = WAL");
dynamicDatabase
  .prepare(
    "create table if not exists users " +
      "(id integer primary key, name text, email text, identity_key text, secret_key_hash text)"
  )
  .run();

module.exports = {
  staticDatabase,
  dynamicDatabase,
};
