/**
 * Provide Express handlers for the Quotes API.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const express = require("express");

const authorizer = require("../utils/authorizer");
const { staticDatabase } = require("../utils/database");

const router = express.Router();
router.use(authorizer);

router.get("/", (_, res) => {
  const getRandomQuote = staticDatabase.prepare(
    "select * from quotes order by random() limit 1"
  );
  const randomQuote = getRandomQuote.get();
  res.status(200).json(randomQuote);
});

router.get("/:author", (req, res) => {
  let author;
  switch (req.params.author) {
    case "moira-burton":
      author = "Moira Burton";
      break;
    default:
      res.status(400).send(`Unsupported author: ${req.params.author}`);
      return;
  }
  const getAuthorQuote = staticDatabase.prepare(
    "select * from quotes where author = ? order by random() limit 1"
  );
  const randomAuthorQuote = getAuthorQuote.get(author);
  res.status(200).json(randomAuthorQuote);
});

module.exports = router;
