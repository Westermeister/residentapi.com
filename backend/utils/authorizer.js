/**
 * Export authorization middleware.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const argon2 = require("argon2");

const database = require("./database");

/**
 * Ensure API call is authorized; upon failure, respond with appropriate HTTP status code and message.
 * @param {express.Request} req - Needs headers "identity-key" and "secret-key", both of which lead to 64-char hex.
 * @param {express.Response} res - Used to send a response in case of failed authentication.
 * @param {express.NextFunction} next - Used to move onto the route handler.
 */
async function authorizer(req, res, next) {
  // We got the headers... right?
  let identityHeader = req.get("identity-key");
  let secretHeader = req.get("secret-key");
  if (identityHeader === undefined || secretHeader === undefined) {
    res.status(400).send("Missing header(s): identity-key/secret-key");
    return;
  }

  // We have the headers. Before we forget, let's lowercase them.
  identityHeader = identityHeader.toLowerCase();
  secretHeader = secretHeader.toLowerCase();

  // Now let's make sure the headers' values have the correct prefix.
  if (
    !identityHeader.startsWith("identity-") ||
    !secretHeader.startsWith("secret-")
  ) {
    res
      .status(400)
      .send('API keys must have "identity-" or "secret-" prefixes!');
    return;
  }

  // Now we check the hexadecimal portion. Is it there?
  const identityHeaderSplit = identityHeader.split("-");
  const secretHeaderSplit = secretHeader.split("-");
  if (identityHeaderSplit.length !== 2 || secretHeaderSplit.length !== 2) {
    res
      .status(400)
      .send(
        "The identity and/or secret key is missing its hexadecimal portion."
      );
    return;
  }

  // The hex is there, but is it valid?
  const keyRegex = /[0-9a-f]{64}/;
  if (
    !keyRegex.test(identityHeaderSplit[1]) ||
    !keyRegex.test(secretHeaderSplit[1])
  ) {
    res
      .status(400)
      .send(
        "The hexadecimal part of the identity and/or secret key is invalid. Ensure it passes regex: /[0-9a-f]{64}/"
      );
    return;
  }

  // With user input sanitization done, we do the actual logic.
  // First, verify that the user exists by checking for the identity key,
  const getUser = database.prepare(
    "select count(1) from users where identityKey = ? limit 1"
  );
  const userExists = getUser.get(identityHeader)["count(1)"];
  if (!userExists) {
    res.status(401).send("Identity key is not recognized.");
    return;
  }

  // Second, ensure that the secret key is valid.
  const getSecretKey = database.prepare(
    "select secretKeyHash from users where identityKey = ? limit 1"
  );
  const secretKeyHash = getSecretKey.get(identityHeader).secretKeyHash;
  try {
    if (await argon2.verify(secretKeyHash, secretHeader)) {
      next();
    } else {
      res.status(401).send("Secret key is invalid.");
    }
  } catch {
    res
      .status(500)
      .send(
        "Server had internal failure while trying to verify secret key. Please try again later."
      );
  }
}

module.exports = authorizer;
