/**
 * Provide Express handler for user registration.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import argon2 from "argon2";
import express from "express";

import { userDatabase } from "../database/bindings";

/**
 * Validate presence of required inputs (and their types) according to the frontend validation.
 * @param req - Should have "username", "email", and "password" body params.
 * @returns True if valid, false otherwise.
 */
function inputsPresent(req: express.Request): boolean {
  if (
    typeof req.body.username !== "string" ||
    typeof req.body.email !== "string" ||
    typeof req.body.password !== "string" ||
    req.body.username.length === 0 ||
    req.body.email.length === 0 ||
    req.body.password.length === 0
  ) {
    return false;
  }
  return true;
}

/**
 * Validate that each input field conforms to the frontend validation.
 * @param req - Should have "username", "email", and "password" body params.
 * @returns True if valid, false otherwise.
 */
function inputsClean(req: express.Request): boolean {
  // Username should be <20 chars of alphanumerics and underscores only.
  const usernamePattern = /^[a-zA-Z0-9_]{1,20}$/;
  if (!usernamePattern.test(req.body.username)) {
    return false;
  }
  // Email address should be capped at 254 characters max, and have "@".
  // Source: https://stackoverflow.com/a/574698/5797334
  if (req.body.email.length > 254 || !req.body.email.includes("@")) {
    return false;
  }
  // Passwords must meet the length restrictions and be alphanumeric.
  const passwordPattern = /^[a-zA-Z0-9]{8,128}$/;
  if (!passwordPattern.test(req.body.password)) {
    return false;
  }
  return true;
}

/**
 * Ensure that the username isn't already in the database.
 * @param username - The username to check.
 * @returns True if username is unique, false otherwise.
 */
function uniqueUsername(username: string): boolean {
  const usernameExists = !!userDatabase
    .prepare("SELECT COUNT(1) AS count FROM users WHERE user_id = ? LIMIT 1")
    .get(username).count;
  if (usernameExists) {
    return false;
  }
  return true;
}

/**
 * Register a new user.
 * @param req - A POST with a JSON body. Should have "username", "email", and "password" body params.
 *              Username can only contain alphanumerics and underscores, and have length in [1, 20].
 *              Email must have an "@" symbol and have length in [1, 254].
 *              Password must have length in [8, 128].
 * @param res - Used to send back status codes, errors, etc.
 */
async function registerUser(
  req: express.Request,
  res: express.Response
): Promise<void> {
  if (!inputsPresent(req)) {
    res.status(400).json({ message: "Missing input(s)." });
    return;
  }
  if (!inputsClean(req)) {
    res.status(400).json({ message: "Malformed input(s)." });
    return;
  }
  if (!uniqueUsername(req.body.username)) {
    res
      .status(409)
      .json({ message: `Username already exists: ${req.body.username}` });
    return;
  }
  const passwordSaltedHash = await argon2.hash(req.body.password, {
    type: argon2.argon2id,
  });
  userDatabase
    .prepare("INSERT INTO users VALUES (?, ?, ?, ?)")
    .run(req.body.username, req.body.email, passwordSaltedHash, 0);
  res.sendStatus(201);
}

const registerRouter = express.Router();
registerRouter.use(express.json());
registerRouter.post("/", registerUser);

export { registerRouter };
