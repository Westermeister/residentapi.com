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
    req.body.captcha === undefined ||
    req.body.name === undefined ||
    req.body.email === undefined ||
    typeof req.body.captcha !== "string" ||
    typeof req.body.name !== "string" ||
    typeof req.body.email !== "string"
  ) {
    res.status(400).send("Malformed request");
    return;
  }

  // Verify that the captcha was successful.
  const body = new URLSearchParams();
  body.append("sitekey", process.env.H_CAPTCHA_SITEKEY);
  body.append("secret", process.env.H_CAPTCHA_SECRET);
  body.append("response", req.body.captcha);
  body.append("remoteip", req.ip);
  try {
    const fetchedCaptchaResponse = await fetch(
      "https://hcaptcha.com/siteverify",
      {
        method: "post",
        body: body,
      }
    );
    const captchaResponse = await fetchedCaptchaResponse.json();
    if (!captchaResponse.success) {
      res.status(401).send("Failed to verify captcha");
      return;
    }
  } catch {
    res.status(500).send("Failed to verify captcha");
    return;
  }

  // Prepare to add user to database.
  // Start by capping max length of name and email values in case of spam.
  req.body.name = req.body.name.substr(0, 1000);
  req.body.email = req.body.email.substr(0, 1000);

  // While we're at it, let's make sure that we don't have a duplicate email.
  const checkDuplicateEmail = dynamicDatabase.prepare(
    "select count(1) from users where email = ? limit 1"
  );
  const duplicateEmail = checkDuplicateEmail.get(req.body.email)["count(1)"];
  if (duplicateEmail) {
    res
      .status(409)
      .send(`User already exists with given email: ${req.body.email}`);
    return;
  }

  // Generate identity key. Make sure it doesn't already exist.
  let identityKey = "identity-" + crypto.randomBytes(32).toString("hex");
  const getDuplicates = dynamicDatabase.prepare(
    "select count(1) from users where identity_key = ? limit 1"
  );
  let duplicates = getDuplicates.get(identityKey)["count(1)"];
  while (duplicates > 0) {
    identityKey = "identity-" + crypto.randomBytes(32).toString("hex");
    duplicates = getDuplicates.get(identityKey)["count(1)"];
  }

  // Generate secret key and the Argon2id hash.
  const secretKey = "secret-" + crypto.randomBytes(32).toString("hex");
  // Using recommended parameters from Argon2's IETF draft; version 13, option 2:
  // https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-argon2-13#page-13
  const secretKeyHash = await argon2.hash(secretKey, {
    type: argon2.argon2id,
    timeCost: 3,
    parallelism: 4,
    memoryCost: 2 ** 16,
    saltLength: 16,
    hashLength: 32,
  });

  // Add user to database.
  const addUser = dynamicDatabase.prepare(
    "insert into users (name, email, identity_key, secret_key_hash) values (?, ?, ?, ?)"
  );
  addUser.run(req.body.name, req.body.email, identityKey, secretKeyHash);

  // Return the identity and secret keys to the frontend.
  res.status(201).json({ identityKey: identityKey, secretKey: secretKey });
});

module.exports = router;
