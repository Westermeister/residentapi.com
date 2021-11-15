/**
 * Tests for rate limiting the quotes API.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const fetch = require("node-fetch");
const sqlite = require("better-sqlite3");

// The frontend should be available on 8080 and reverse-proxy for the "/register" and "/quotes" routes.
const SIGNUP_API_ENDPOINT = "http://localhost:8080/register";
const QUOTES_API_ENDPOINT = "http://localhost:8080/quotes";

// Test database for users.
const userDatabase = sqlite("./dist/backend/database/users.test.db");

// Constant credentials.
const USERNAME = "lkennedy";
const PASSWORD = "marryMeAda";
const CREDENTIALS = Buffer.from(`${USERNAME}:${PASSWORD}`, "ascii").toString("base64");
const HEADER = `Basic: ${CREDENTIALS}`;

beforeAll(async () => {
  // Make sure we clear the test database from any previous test runs.
  userDatabase.prepare("DELETE FROM users").run();
  // Add the new user.
  const formData = {
    username: USERNAME,
    email: "lkennedy@rpd.org",
    password: PASSWORD
  };
  const response = await fetch(SIGNUP_API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(201);
});

afterAll(() => {
  // Clear the test user database from data added during these tests.
  userDatabase.prepare("DELETE FROM users").run();
});

test("Request two random quotes in rapid succession", async () => {
  let response = await fetch(QUOTES_API_ENDPOINT, {
    method: "get",
    headers: { "Authorization": HEADER }
  });
  expect(response.status).toBe(200);
  response = await fetch(QUOTES_API_ENDPOINT, {
    method: "get",
    headers: { "Authorization": HEADER }
  });
  expect(response.status).toBe(429);
});
