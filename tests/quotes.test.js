/**
 * Tests for the quotes API.
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

beforeEach(async () => {
  // Respect the one-second rate limit.
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

test("Request a random quote", async () => {
  const response = await fetch(QUOTES_API_ENDPOINT, {
    method: "get",
    headers: { "Identity-Key": identityKey, "Secret-Key": secretKey },
  });
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty("quote");
  expect(data).toHaveProperty("author");
  expect(data).toHaveProperty("context");
  expect(data).toHaveProperty("source");
});

test("Request a random quote from a specific author", async () => {
  const response = await fetch(
    QUOTES_API_ENDPOINT + "?character=moira-burton",
    {
      method: "get",
      headers: { "Identity-Key": identityKey, "Secret-Key": secretKey },
    }
  );
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty("quote");
  expect(data).toHaveProperty("author", "Moira Burton");
  expect(data).toHaveProperty("context");
  expect(data).toHaveProperty("source");
});

test("Request a random quote from a specific source", async () => {
  const response = await fetch(
    QUOTES_API_ENDPOINT + "?source=resident-evil-5",
    {
      method: "get",
      headers: { "Identity-Key": identityKey, "Secret-Key": secretKey },
    }
  );
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty("quote");
  expect(data).toHaveProperty("author");
  expect(data).toHaveProperty("context");
  expect(data).toHaveProperty("source", "Resident Evil 5");
});

test("Request a random quote from a specific author and source", async () => {
  const response = await fetch(
    QUOTES_API_ENDPOINT + "?character=leon-kennedy&source=resident-evil-4",
    {
      method: "get",
      headers: { "Identity-Key": identityKey, "Secret-Key": secretKey },
    }
  );
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toHaveProperty("quote");
  expect(data).toHaveProperty("author", "Leon Kennedy");
  expect(data).toHaveProperty("context");
  expect(data).toHaveProperty("source", "Resident Evil 4");
});
