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

let identityKey;
let secretKey;

beforeAll(async () => {
  // Make sure we clear the test database from any previous test runs.
  userDatabase.prepare("delete from users").run();
  // Add the new user.
  const formData = {
    name: "Leon Kennedy",
    reason: "",
    email: "lkennedy@rpd.org",
  };
  const response = await fetch(SIGNUP_API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(201);
  // Get the identity and secret keys.
  const data = await response.json();
  identityKey = data.identityKey;
  secretKey = data.secretKey;
});

afterAll(() => {
  // Clear the test user database from data added during these tests.
  userDatabase.prepare("delete from users").run();
});

test("Request two random quotes in rapid succession", async () => {
  let response = await fetch(QUOTES_API_ENDPOINT, {
    method: "get",
    headers: { "Identity-Key": identityKey, "Secret-Key": secretKey },
  });
  expect(response.status).toBe(200);
  response = await fetch(QUOTES_API_ENDPOINT, {
    method: "get",
    headers: { "Identity-Key": identityKey, "Secret-Key": secretKey },
  });
  expect(response.status).toBe(429);
});
