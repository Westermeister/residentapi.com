/**
 * Tests for account management portal.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const fetch = require("node-fetch");
const sqlite = require("better-sqlite3");

// The frontend should be available on 8080 and reverse-proxy for the "/register" and "/portal" routes.
const API_ENDPOINT = "http://localhost:8080/register";
const PORTAL_SIGN_IN_ENDPOINT = "http://localhost:8080/portal";
const PORTAL_CHANGE_EMAIL_ENDPOINT = "http://localhost:8080/portal/change-email";
const PORTAL_CHANGE_PASSWORD_ENDPOINT = "http://localhost:8080/portal/change-password";
const PORTAL_DELETE_ACCOUNT_ENDPOINT = "http://localhost:8080/portal/delete-account";

// Test database for users.
const userDatabase = sqlite("./dist/backend/database/users.test.db");

// Constant credentials.
const USERNAME = "lkennedy";
const PASSWORD = "marryMeAda";
const CREDENTIALS = Buffer.from(`${USERNAME}:${PASSWORD}`, "ascii").toString("base64");
const HEADER = `Basic ${CREDENTIALS}`;

beforeAll(async () => {
  // Make sure the test user database is empty except for a testing account.
  userDatabase.prepare("DELETE FROM users").run();
  const formData = {
    username: "lkennedy",
    email: "lkennedy@rpd.org",
    password: "marryMeAda"
  };
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(201);
});

afterAll(() => {
  // Clear the test user database from data added during these tests.
  userDatabase.prepare("DELETE FROM users").run();
});

test("Attempt to access the portal with bogus credentials", async () => {
  const badHeader = "Basic " + Buffer.from("lkennedy:marryMeClaire", "ascii").toString("base64");
  const response = await fetch(PORTAL_SIGN_IN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: badHeader,
    },
  });
  expect(response.status).toBe(401);
});

test("Change email address", async () => {
  const formData = {
    username: "lkennedy",
    newEmail: "lkennedy@whitehouse.gov"
  };
  const response = await fetch(PORTAL_CHANGE_EMAIL_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(formData),
    headers: {
      "Content-Type": "application/json",
      Authorization: HEADER,
    },
  });
  expect(response.status).toBe(200);
});

test("Change password", async () => {
  // Happens to be the same, but doesn't matter.
  // As long as the API successfully registers it, it's fine.
  const formData = {
    username: "lkennedy",
    newPassword: "marryMeAda"
  };
  const response = await fetch(PORTAL_CHANGE_PASSWORD_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(formData),
    headers: {
      "Content-Type": "application/json",
      Authorization: HEADER,
    },
  });
  expect(response.status).toBe(200);
});

test("Delete account", async () => {
  const formData = { username: "lkennedy" };
  const response = await fetch(PORTAL_DELETE_ACCOUNT_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(formData),
    headers: {
      "Content-Type": "application/json",
      Authorization: HEADER,
    },
  });
  expect(response.status).toBe(200);
});
