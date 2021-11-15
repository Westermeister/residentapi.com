/**
 * Middleware for validating API calls from end users.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import * as argon2 from "argon2";
import express from "express";

import { userDatabase } from "../database/bindings";

/**
 * Rate limit the incoming request, or just update the database with the new timestamp.
 * @param username - The user that's sending the request.
 * @returns True if request has followed the rate limit, false otherwise.
 */
function rateLimit(username: string): boolean {
  const currentTime = Date.now();
  const lastCall = userDatabase
    .prepare("SELECT last_call FROM users WHERE user_id = ? LIMIT 1")
    .get(username).last_call;
  if (currentTime - lastCall < 1000) {
    return false;
  }
  userDatabase
    .prepare("UPDATE users SET last_call = ? WHERE user_id = ?")
    .run(currentTime, username);
  return true;
}

/**
 * Validate and authenticate incoming calls from end users to the API.
 * @param req - See exported function for format.
 * @param res - Used to send back error code and relevant message if sanitization failed.
 * @param next - Used to proceed to the next middleware if successful.
 */
async function validateUserRequest(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  // Do we even have the header in the first place?
  const header = req.get("authorization");
  if (header === undefined) {
    res.status(400).json({ error: "Missing header: Authorization" });
    return;
  }

  // Ensure the header is formatted correctly.
  const headerFormat = /^Basic: [a-zA-Z0-9+/=]+$/;
  if (!headerFormat.test(header)) {
    res.status(400).json({
      error:
        'Malformed header: Authorization. Must be: "Basic: base64_stuff_here"',
    });
    return;
  }

  // Ensure the credentials are formatted correctly.
  const data = header.split(" ")[1];
  const credentials = Buffer.from(data, "base64").toString("ascii");
  const credentialsFormat = /^[a-zA-Z0-9_]{1,20}:[a-zA-Z0-9]{8,128}$/;
  if (!credentialsFormat.test(credentials)) {
    res.status(400).json({
      error:
        "Malformed header: Authorization. Decoded base64 value is not valid.",
    });
    return;
  }

  // Now try to authenticate the request.
  const [username, password] = credentials.split(":");
  const userExists = userDatabase
    .prepare("SELECT COUNT(1) as exists_ FROM users WHERE user_id = ? LIMIT 1")
    .get(username).exists_;
  if (!userExists) {
    res.status(401).json({ error: `Username does not exist: ${username}` });
    return;
  }
  const passwordSaltedHash = userDatabase
    .prepare("SELECT password_salted_hash FROM users WHERE user_id = ? LIMIT 1")
    .get(username).password_salted_hash;
  try {
    const correctPassword = await argon2.verify(passwordSaltedHash, password);
    if (!correctPassword) {
      res.status(401).json({ error: "Password is incorrect." });
      return;
    }
  } catch {
    res.status(500).json({
      error:
        "Server encountered unknown error while verifying password. If this issue persists, please contact support: support@residentapi.com",
    });
    return;
  }

  // Finally, ensure the rate limit was respected.
  if (!rateLimit(username)) {
    res.status(429).json({ error: "Exceeded 1 second rate limit." });
    return;
  }

  // If we got past all of that, we're good.
  next();
}

export { validateUserRequest };
