/**
 * Provide Express handler for user registration.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

require("dotenv").config({ path: "../../.env" });

const crypto = require("crypto");

const argon2 = require("argon2");
const express = require("express");
const fetch = require("node-fetch");

const { dynamicDatabase } = require("../utils/database");

const router = express.Router();
router.use(express.urlencoded({ extended: true }));

router.post("/", async (req, res) => {
  // Check for required parameters and their types.
  if (
    req.body["h-captcha-response"] === undefined ||
    req.body.name === undefined ||
    req.body.email === undefined ||
    typeof req.body["h-captcha-response"] !== "string" ||
    typeof req.body.name !== "string" ||
    typeof req.body.email !== "string"
  ) {
    res.status(400).send("Malformed request");
    return;
  }

  // Verify that the captcha was successful.
  const fetchedCaptchaResponse = await fetch(
    "https://hcaptcha.com/siteverify",
    {
      method: "post",
      body: `response=${req.body["h-captcha-response"]}&secret=${process.env.H_CAPTCHA_SECRET}`,
    }
  );
  const captchaResponse = await fetchedCaptchaResponse.json();
  if (!captchaResponse.success) {
    res.status(401).send("Failed captcha");
    return;
  }

  // Prepare to add user to database.
  // Start by capping max length of name and email values in case of spam.
  req.body.name = req.body.name.substr(0, 1000);
  req.body.email = req.body.email.substr(0, 1000);

  // Generate identity key. Make sure it doesn't already exist.
  let identityKey = "identity-" + crypto.randomBytes(32).toString("hex");
  const getDuplicates = dynamicDatabase.prepare(
    "select count(1) from users where identity_key = ?"
  );
  let duplicates = getDuplicates.get(identityKey).identity_key;
  while (duplicates > 0) {
    identityKey = "identity-" + crypto.randomBytes(32).toString("hex");
    duplicates = getDuplicates.get(identityKey).identity_key;
  }

  // Generate secret key and the Argon2id hash.
  const secretKey = "secret-" + crypto.randomBytes(32).toString("hex");
  const secretKeyHash = await argon2.hash(secretKey, { type: argon2.argon2id });

  // Add user to database.
  const addUser = dynamicDatabase.prepare(
    "insert into users (name, email, identity_key, secret_key_hash) values (?, ?, ?, ?)"
  );
  addUser.run(req.body.name, req.body.email, identityKey, secretKeyHash);

  // Return the identity and secret keys to the frontend.
  res.status(201).json({ identityKey: identityKey, secretKey: secretKey });
});

module.exports = router;
