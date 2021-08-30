/**
 * Provide Express handler for user registration.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const crypto = require("crypto");

const argon2 = require("argon2");
const express = require("express");

const { userDatabase } = require("../database/bindings");

/**
 * Filters out requests that have filled the honeypot field.
 * @param {express.Request} req - Should have an "address" body param that actually serves as the honeypot.
 * @returns {boolean} True if request is spam, false otherwise.
 */
function isSpam(req) {
  return typeof req.body.address !== "string" || req.body.address.length > 0;
}

/**
 * Verify presence of required inputs and their types.
 * @param {express.Request} req - Should have "name" and "email" body params.
 * @returns {boolean} True if valid, false otherwise.
 */
function validInputs(req) {
  return (
    typeof req.body.name === "string" && typeof req.body.email === "string"
  );
}

/**
 * Generates unique identity key.
 * @returns {string} "identity-" + a unique, 64-char hex string.
 */
function generateIdentityKey() {
  let identityKey = "identity-" + crypto.randomBytes(32).toString("hex");
  let numDuplicates = userDatabase
    .prepare("select count(1) from users where identity_key = ? limit 1")
    .get(identityKey)["count(1)"];
  while (numDuplicates > 0) {
    identityKey = "identity-" + crypto.randomBytes(32).toString("hex");
    numDuplicates = userDatabase
      .prepare("select count(1) from users where identity_key = ? limit 1")
      .get(identityKey)["count(1)"];
  }
  return identityKey;
}

/**
 * Generates secret key and a salted hash.
 * @returns {list} First the raw secret key, then its salted hash via Argon2id.
 */
async function generateSecretKeyPair() {
  const secretKey = "secret-" + crypto.randomBytes(32).toString("hex");
  const secretKeyHash = await argon2.hash(secretKey, { type: argon2.argon2id });
  return [secretKey, secretKeyHash];
}

/**
 * Register a new user.
 * @param {express.Request} req - Should have "name", "email", and "address" (honeypot) body parameters
 * @param {express.Response} res - Used to send back status codes and/or API keys.
 */
async function registerUser(req, res) {
  // Send a fake success response if we detect spam.
  if (isSpam(req)) {
    res.status(200).json({ message: "Sign up successful" });
    return;
  }

  // Verify that the rest of the inputs are syntactically valid.
  if (!validInputs(req)) {
    res.status(400).json({ error: 'Invalid "name" and/or "email" inputs.' });
    return;
  }

  // Before we go further, cap name and email strings to prevent abuse.
  const name = req.body.name.substr(0, 1000);
  const email = req.body.email.substr(0, 1000);

  // Ensure email isn't a duplicate.
  const duplicateEmail = userDatabase
    .prepare("select count(1) from users where email = ? limit 1")
    .get(email)["count(1)"];
  if (duplicateEmail) {
    res
      .status(409)
      .json({ error: `User already exists with given email: ${email}` });
    return;
  }

  // We're all good at this point. Let's generate the API keys.
  const identityKey = generateIdentityKey();
  const [secretKey, secretKeyHash] = await generateSecretKeyPair();

  // Add user to database.
  userDatabase
    .prepare(
      "insert into users (name, email, identity_key, secret_key_hash) values (?, ?, ?, ?)"
    )
    .run(name, email, identityKey, secretKeyHash);

  // Finally, respond with the API keys.
  res.status(201).json({ identityKey: identityKey, secretKey: secretKey });
}

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.post("/", registerUser);

module.exports = router;
