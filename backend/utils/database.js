/**
 * Export SQLite database object.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const database = require("better-sqlite3")("../production.db");

module.exports = database;
