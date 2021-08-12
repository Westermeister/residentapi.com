/**
 * Provide facilities relating to user authentication.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const crypto = require("crypto");

const argon2 = require("argon2");

/**
 * Generate the API key used for identifying the client.
 * @returns {string} "identity-" concatenated with a 256-bit, lowercased hex string.
 */
function generateIdentityKey() {
  return "identity-" + crypto.randomBytes(32).toString("hex");
}

/**
 * Use a CSPRNG to generate the secret API key.
 * @returns {string} "secret-" concatenated with a 256-bit, lowercased hex string.
 */
function generateSecretKey() {
  return "secret-" + crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a salted hash of a string using Argon2id.
 * @param {string} key - The input to be salted and hashed.
 * @returns {string} The salted hash.
 */
async function generateKeyHash(key) {
  const hash = await argon2.hash(key, { type: argon2.argon2id });
  return hash;
}

/**
 * Verify given key against salted hash via Argon2id.
 * @param {string} key - The key to check.
 * @param {string} hash - The salted hash to check against.
 * @returns {boolean} True if verified; otherwise false.
 */
async function verifyKeyHash(key, hash) {
  try {
    const status = await argon2.verify(hash, key);
    return status;
  } catch (error) {
    return false;
  }
}
