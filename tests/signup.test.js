/**
 * Tests for sign up form.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

const fetch = require("node-fetch");
const sqlite = require("better-sqlite3");

// The frontend should be available on 8080 and reverse-proxy for the "/register" route.
const API_ENDPOINT = "http://localhost:8080/register";

// Test database for users.
const userDatabase = sqlite("./backend/dist/database/users.test.db");

beforeAll(() => {
  // Make sure the test user database is empty.
  userDatabase.prepare("delete from users").run();
});

afterAll(() => {
  // Clear the test user database from data added during these tests.
  userDatabase.prepare("delete from users").run();
});

test("Sign up without filling out any fields", async () => {
  const formData = {
    name: "",
    reason: "",
    email: "",
  };
  const response = await fetch(API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(400);
});

test("Sign up but only fill out name", async () => {
  const formData = {
    name: "Leon Kennedy",
    reason: "",
    email: "",
  };
  const response = await fetch(API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(400);
});

test("Sign up but only fill out email", async () => {
  const formData = {
    name: "",
    reason: "",
    email: "lkennedy@rpd.org",
  };
  const response = await fetch(API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(400);
});

test("Sign up but actually it's a bot", async () => {
  const formData = {
    name: "qwertyuiop",
    reason: "qwertyuiop",
    email: "qwertyuiop@qwertyuiop",
  };
  const response = await fetch(API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(200);
});

test("Sign up properly", async () => {
  const formData = {
    name: "Leon Kennedy",
    reason: "",
    email: "lkennedy@rpd.org",
  };
  const response = await fetch(API_ENDPOINT, {
    method: "post",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status).toBe(201);
});
