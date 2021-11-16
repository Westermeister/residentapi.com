/**
 * Middleware for authenticating end users.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import * as argon2 from "argon2";
import express from "express";

import { userDatabase } from "../database/bindings";

/**
 * Authenticate the user based off of given credentials.
 * @param req - Should have a header called "Authorization" which is for HTTP Basic authentication.
 *              Should have value "Basic: some_base64_data" where the data is formatted for basic auth.
 *              i.e. some_base64_data = base64encode("username:password")
 * @param res - Used to send back error code and relevant message if authentication failed.
 * @param next - Used to proceed to the next middleware if successful.
 */
async function authenticateUser(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> {
  // Do we even have the header in the first place?
  const header = req.get("authorization");
  if (header === undefined) {
    res.status(400).json({ message: "Missing header: Authorization" });
    return;
  }

  // Ensure the header is formatted correctly.
  const headerFormat = /^Basic [a-zA-Z0-9+/=]+$/;
  if (!headerFormat.test(header)) {
    res.status(400).json({
      message:
        'Malformed header: Authorization. Must be: "Basic base64_stuff_here"',
    });
    return;
  }

  // Ensure the credentials are formatted correctly.
  const data = header.split(" ")[1];
  const credentials = Buffer.from(data, "base64").toString("ascii");
  const credentialsFormat = /^[a-zA-Z0-9_]{1,20}:[a-zA-Z0-9]{8,128}$/;
  if (!credentialsFormat.test(credentials)) {
    res.status(400).json({
      message:
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
    res.status(401).json({ message: `Username does not exist: ${username}` });
    return;
  }
  const passwordSaltedHash = userDatabase
    .prepare("SELECT password_salted_hash FROM users WHERE user_id = ? LIMIT 1")
    .get(username).password_salted_hash;
  try {
    const correctPassword = await argon2.verify(passwordSaltedHash, password);
    if (!correctPassword) {
      res.status(401).json({ message: "Password is incorrect." });
      return;
    }
  } catch {
    res.status(500).json({
      message:
        "Server encountered unknown error while verifying password. Please try again later.",
    });
    return;
  }

  // If we got past all of that, we're good.
  next();
}

export { authenticateUser };
