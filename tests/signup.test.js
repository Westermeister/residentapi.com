/**
 * Tests for sign up form.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const fetch = require("node-fetch");
const sqlite = require("better-sqlite3");

// The frontend should be available on 8080 and reverse-proxy for the "/register" route.
const API_ENDPOINT = "http://localhost:8080/register";

// Test database for users.
const userDatabase = sqlite("./dist/backend/database/users.test.db");

beforeAll(() => {
  // Make sure the test user database is empty.
  userDatabase.prepare("DELETE FROM users").run();
});

afterAll(() => {
  // Clear the test user database from data added during these tests.
  userDatabase.prepare("DELETE FROM users").run();
});

test("Sign up normally", async () => {
  const formData = {
    username: "lkennedy",
    email: "lkennedy@rpd.org",
    password: "marryMeAda"
  };
  const response = await fetch(API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(201);
});
