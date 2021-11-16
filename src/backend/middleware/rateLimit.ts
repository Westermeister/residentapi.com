/**
 * Middleware for rate limiting API calls.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import express from "express";

import { userDatabase } from "../database/bindings";

/**
 * Rate limit a user's incoming request, or just update the database with the new timestamp.
 * @param req - Should have an "Authorization" header consistent with the basic auth protocol.
 *              This is assumed to be already verified i.e. the user is guaranteed authentic.
 * @param res - Used to send back an error if the request came too early.
 * @param next - Used to proceed to the next middleware if successful.
 */
function rateLimit(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const data = req.get("authorization")!.split(" ")[1];
  const credentials = Buffer.from(data, "base64").toString("ascii");
  const username = credentials.split(":")[0];
  const currentTime = Date.now();
  const lastCall = userDatabase
    .prepare("SELECT last_call FROM users WHERE user_id = ? LIMIT 1")
    .get(username).last_call;
  if (currentTime - lastCall < 1000) {
    res.status(429).json({ message: "Exceeded 1 second rate limit." });
    return;
  }
  userDatabase
    .prepare("UPDATE users SET last_call = ? WHERE user_id = ?")
    .run(currentTime, username);
  next();
}

export { rateLimit };
