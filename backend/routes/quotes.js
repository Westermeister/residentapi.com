/**
 * Provide Express handlers for the Quotes API.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const express = require("express");

const validateUserRequest = require("../middleware/validateUserRequest");
const { staticDatabase } = require("../database/bindings");

/**
 * Selects author based off of character code.
 * @param {string} charCode - The given character code in the query parameters.
 * @returns {string} - The selected author.
 * @throws {Error} - If the character code is invalid.
 */
function selectAuthor(charCode) {
  switch (charCode) {
    case "ada-wong":
      return "Ada Wong";
    case "albert-wesker":
      return "Albert Wesker";
    case "alex-wesker":
      return "Alex Wesker";
    case "barry-burton":
      return "Barry Burton";
    case "chris-redfield":
      return "Chris Redfield";
    case "claire-redfield":
      return "Claire Redfield";
    case "ethan-winters":
      return "Ethan Winters";
    case "jill-valentine":
      return "Jill Valentine";
    case "leon-kennedy":
      return "Leon Kennedy";
    case "moira-burton":
      return "Moira Burton";
    case "nemesis":
      return "Nemesis";
    case "sheva-alomar":
      return "Sheva Alomar";
    default:
      throw new Error(`Character code is invalid: ${charCode}`);
  }
}

/**
 * Selects source based off of source code.
 * @param {string} srcCode - The given source code in the query parameters.
 * @returns {string} - The selected source.
 * @throws {Error} - If the source code is invalid.
 */
function selectSource(srcCode) {
  switch (srcCode) {
    case "resident-evil-2":
      return "Resident Evil 2";
    case "resident-evil-2-remake":
      return "Resident Evil 2 Remake";
    case "resident-evil-3-remake":
      return "Resident Evil 3 Remake";
    case "resident-evil-4":
      return "Resident Evil 4";
    case "resident-evil-5":
      return "Resident Evil 5";
    case "resident-evil-6":
      return "Resident Evil 6";
    case "resident-evil-7":
      return "Resident Evil 7";
    case "resident-evil-revelations":
      return "Resident Evil Revelations";
    case "resident-evil-revelations-2":
      return "Resident Evil Revelations 2";
    case "resident-evil-village":
      return "Resident Evil Village";
    default:
      throw new Error(`Source code is invalid: ${srcCode}`);
  }
}

/**
 * Handle incoming requests.
 * @param {express.Request} req - Can have optional query parameters "character" and "source".
 * @param {express.Response} res - Used to send back either the quote object or an error message.
 */
function serveQuote(req, res) {
  try {
    let quote;
    if (req.query.character !== undefined && req.query.source !== undefined) {
      const author = selectAuthor(req.query.character);
      const source = selectSource(req.query.source);
      quote = staticDatabase
        .prepare(
          "select * from quotes where author = ? and source = ? order by random() limit 1"
        )
        .get(author, source);
    } else if (req.query.character !== undefined) {
      const author = selectAuthor(req.query.character);
      quote = staticDatabase
        .prepare(
          "select * from quotes where author = ? order by random() limit 1"
        )
        .get(author);
    } else if (req.query.source !== undefined) {
      const source = selectSource(req.query.source);
      quote = staticDatabase
        .prepare(
          "select * from quotes where source = ? order by random() limit 1"
        )
        .get(source);
    } else {
      quote = staticDatabase
        .prepare("select * from quotes order by random() limit 1")
        .get();
    }
    res.status(200).json(quote);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

const router = express.Router();
router.use(validateUserRequest);
router.get("/", serveQuote);

module.exports = router;
