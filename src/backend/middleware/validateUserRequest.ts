/**
 * Middleware for validating API calls from end users.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import * as argon2 from "argon2";
import express from "express";

import { userDatabase } from "../database/bindings";

/**
 * Ensure the incoming request is syntactically valid.
 * @param req - Expects headers "identity-key" and "secret-key" i.e. the API keys.
 * @param res - Used to send back error code and relevant message if sanitization failed.
 * @returns True if request is clean, otherwise false.
 */
function sanitizeRequest(req: express.Request, res: express.Response): boolean {
  // Ensure headers exist.
  const identityHeader = req.get("identity-key");
  const secretHeader = req.get("secret-key");
  if (identityHeader === undefined || secretHeader === undefined) {
    res
      .status(400)
      .json({ error: "Missing header(s): IDENTITY-KEY and/or SECRET-KEY" });
    return false;
  }

  // Ensure header prefixes exist.
  if (
    !identityHeader.startsWith("identity-") ||
    !secretHeader.startsWith("secret-")
  ) {
    res
      .status(400)
      .json({ error: 'API keys must have "identity-" or "secret-" prefixes!' });
    return false;
  }

  // Ensure hex portions exist.
  const identityHeaderSplit = identityHeader.split("-");
  const secretHeaderSplit = secretHeader.split("-");
  if (
    identityHeaderSplit.length !== 2 ||
    identityHeaderSplit[1] === "" ||
    secretHeaderSplit.length !== 2 ||
    secretHeaderSplit[1] === ""
  ) {
    res.status(400).json({
      error:
        "The identity and/or secret key is missing its hexadecimal portion.",
    });
    return false;
  }

  // Ensure hex portions are valid.
  const keyRegex = /[0-9a-f]{64}/;
  if (
    !keyRegex.test(identityHeaderSplit[1]) ||
    !keyRegex.test(secretHeaderSplit[1])
  ) {
    res.status(400).json({
      error:
        "The hexadecimal part of the identity and/or secret key is invalid. Ensure it passes regex: /[0-9a-f]{64}/",
    });
    return false;
  }

  // If we got through all of that, the request is clean.
  return true;
}

/**
 * Authenticate requests by checking the API keys against the database.
 * @param req - Expects headers "identity-key" and "secret-key" i.e. the API keys.
 * @param res - Used to send back error code and relevant message if authentication failed.
 * @returns True if request is authentic, otherwise false.
 */
async function authenticateRequest(
  req: express.Request,
  res: express.Response
): Promise<boolean> {
  // First, verify that the user exists by checking for the identity key,
  const userExists = userDatabase
    .prepare("select count(1) from users where identity_key = ? limit 1")
    .get(req.get("identity-key"))["count(1)"];
  if (!userExists) {
    res.status(401).json({ error: "Identity key is not recognized." });
    return false;
  }

  // Second, ensure that the secret key matches.
  const secretKeyHash = userDatabase
    .prepare("select secret_key_hash from users where identity_key = ? limit 1")
    .get(req.get("identity-key")).secret_key_hash;
  try {
    if (await argon2.verify(secretKeyHash, req.get("secret-key")!)) {
      return true;
    } else {
      res.status(401).json({ error: "Secret key is invalid." });
      return false;
    }
  } catch {
    res.status(500).json({
      error:
        "Server encountered unknown error while trying to verify secret key. Please try again later.",
    });
    return false;
  }
}

/**
 * Rate limit the incoming request, or just update the database with the new timestamp.
 * @param req - Should have an "identity-key" header; will be used to check last call.
 * @param res - Used to send back an error message if the request hasn't followed the rate limit.
 * @returns True if request has followed the rate limit, false otherwise.
 */
function isRateLimited(req: express.Request, res: express.Response): boolean {
  const currentTime = Date.now();
  const lastCall = userDatabase
    .prepare("select last_call from users where identity_key = ? limit 1")
    .get(req.get("identity-key")).last_call;
  if (currentTime - lastCall < 1000) {
    res.status(429).json({ error: "Rate limit is one request every second!" });
    return false;
  }
  userDatabase
    .prepare("update users set last_call = ? where identity_key = ?")
    .run(currentTime, req.get("identity-key"));
  return true;
}

/**
 * Validate incoming calls from end users to the API.
 * @param req - Expects headers "identity-key" and "secret-key" i.e. the API keys.
 * @param res - Used to send back error code and relevant message if sanitization failed.
 * @param next - Used to proceed to the next middleware if successful.
 */
async function validateUserRequest(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  const cleanRequest = sanitizeRequest(req, res);
  const authenticRequest = await authenticateRequest(req, res);
  const rateLimitedRequest = isRateLimited(req, res);
  if (cleanRequest && authenticRequest && rateLimitedRequest) {
    next();
  }
}

export { validateUserRequest };
