/**
 * Provide Express handler for user registration.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const crypto = require("crypto");

const argon2 = require("argon2");
const express = require("express");

const { userDatabase } = require("../database/bindings");

/**
 * Verify presence of required inputs and their required datatypes.
 * @param {express.Request} req - Should have "name" and "email" body params.
 * @param {express.Response} res - Used to send an error message if the inputs aren't valid.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateInputs(req, res) {
  if (
    typeof req.body.name !== "string" ||
    typeof req.body.reason !== "string" ||
    typeof req.body.email !== "string" ||
    req.body.name.length === 0 ||
    req.body.email.length === 0
  ) {
    res
      .status(400)
      .json({ error: 'Invalid "name", "reason", or "email" inputs.' });
    return false;
  }
  return true;
}

/**
 * Filters out requests that have filled the honeypot field.
 * @param {express.Request} req - Should have an "reason" body param that actually serves as the honeypot.
 * @param {express.Response} res - Used to send a fake success response in case of spam.
 * @returns {boolean} True if request is spam, false otherwise.
 */
function detectSpam(req, res) {
  if (req.body.reason.length > 0) {
    res.status(200).json({ message: "Sign up successful" });
    return true;
  }
  return false;
}

/**
 * Cap the maximum length of the inputs to prevent abuse.
 * @param {express.Request} req - Should have "name" and "email" params in the POST body.
 */
function capInputs(req) {
  return [req.body.name.substr(0, 1000), req.body.email.substr(0, 1000)];
}

/**
 * Ensure that the user's email isn't already in the database.
 * @param {string} email - The user's email address.
 * @param {express.Response} res - Used to send an error response in case of a duplicate.
 * @returns {boolean} True if email is unique, false otherwise.
 */
function verifyUniqueEmail(email, res) {
  const duplicateEmail = userDatabase
    .prepare("select count(1) from users where email = ? limit 1")
    .get(email)["count(1)"];
  if (duplicateEmail) {
    res
      .status(409)
      .json({ error: `User already exists with given email: ${email}` });
    return false;
  }
  return true;
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
 * @param {express.Request} req - Should have "name", "email", and "reason" (honeypot) params in POST body.
 * @param {express.Response} res - Used to send back status codes, errors, and/or API keys.
 */
async function registerUser(req, res) {
  const validInputs = validateInputs(req, res);
  const isSpam = detectSpam(req, res);
  if (validInputs && !isSpam) {
    const [name, email] = capInputs(req);
    const uniqueEmail = verifyUniqueEmail(email, res);
    // If true, then we're all good from here on out to add the user like normal.
    if (uniqueEmail) {
      const identityKey = generateIdentityKey();
      const [secretKey, secretKeyHash] = await generateSecretKeyPair();
      userDatabase
        .prepare(
          "insert into users (name, email, identity_key, secret_key_hash) values (?, ?, ?, ?)"
        )
        .run(name, email, identityKey, secretKeyHash);
      res.status(201).json({ identityKey: identityKey, secretKey: secretKey });
    }
  }
}

const router = express.Router();
router.use(express.json());
router.post("/", registerUser);

module.exports = router;
