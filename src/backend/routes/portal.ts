/**
 * Provide Express handlers for the account management portal.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import * as argon2 from "argon2";
import express from "express";

import { authenticateUser } from "../middleware/authenticateUser";
import { userDatabase } from "../database/bindings";

/**
 * "Sign in" a user by verifying their credentials.
 * @param req - A POST request.
 * @param res - Used to send back either a "verified user" response.
 */
function signInUser(req: express.Request, res: express.Response): void {
  // Almost all of the actual logic is done using the "authenticateUser" middleware.
  // All this function does is handle the successful verification response.
  res.status(200).json({ message: "User is authentic." });
}

/**
 * Change the user's email address.
 * @param req - A POST with "newEmail" and "username" params.
 * @param res - Used to send back the success response or an error if the email is malformed.
 */
function changeEmail(req: express.Request, res: express.Response): void {
  // Email address should be capped at 254 characters max, and have "@".
  // Source: https://stackoverflow.com/a/574698/5797334
  if (req.body.newEmail.length > 254 || !req.body.newEmail.includes("@")) {
    res.status(400).json({ message: "Email address is invalid." });
    return;
  }
  userDatabase
    .prepare("UPDATE users SET email = ? WHERE user_id = ?")
    .run(req.body.newEmail, req.body.username);
  res.status(200).json({ message: "Email updated successfully." });
}

/**
 * Change the user's email address.
 * @param req - A POST with "newPassword" and "username" params.
 * @param res - Used to send back the success response or an error if the password is malformed.
 */
async function changePassword(
  req: express.Request,
  res: express.Response
): Promise<void> {
  // Passwords must meet the length restrictions and be alphanumeric.
  const passwordPattern = /^[a-zA-Z0-9]{8,128}$/;
  if (!passwordPattern.test(req.body.newPassword)) {
    res.status(400).json({ message: "Password does not meet requirements." });
    return;
  }
  const passwordSaltedHash = await argon2.hash(req.body.newPassword, {
    type: argon2.argon2id,
  });
  userDatabase
    .prepare("UPDATE users SET password_salted_hash = ? WHERE user_id = ?")
    .run(passwordSaltedHash, req.body.username);
  res.status(200).json({ message: "Password updated successfully." });
}

/**
 * Change the user's email address.
 * @param req - A POST with a "username" param.
 * @param res - Used to send back the success response.
 */
function deleteAccount(req: express.Request, res: express.Response): void {
  userDatabase
    .prepare("DELETE FROM users WHERE user_id = ?")
    .run(req.body.username);
  res.status(200).json({ message: "Account deleted successfully." });
}

/**
 * Get the user's current email.
 * @param req - A POST with a "username" param.
 * @param res - Used to send back the email.
 */
function getCurrentEmail(req: express.Request, res: express.Response): void {
  const currentEmail = userDatabase
    .prepare("SELECT email FROM users WHERE user_id = ?")
    .get(req.body.username).email;
  res.status(200).json({ message: currentEmail });
}

const portalRouter = express.Router();
portalRouter.use(authenticateUser, express.json());

portalRouter.post("/sign-in", signInUser);
portalRouter.post("/get-current-email", getCurrentEmail);
portalRouter.post("/change-email", changeEmail);
portalRouter.post("/change-password", changePassword);
portalRouter.post("/delete-account", deleteAccount);

export { portalRouter };
