/**
 * Express entry point that initializes the monolithic backend API routes.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

// Validate that the .env file is configured correctly.

import { config } from "dotenv";

config({ path: "./.env" });

if (process.env.NODE_ENV === undefined) {
  throw new Error("Missing environment variable: NODE_ENV");
}

if (
  process.env.NODE_ENV !== "development" &&
  process.env.PRODUCTION_PORT === undefined
) {
  throw new Error(
    "Missing required environment variable for production mode: PRODUCTION_PORT"
  );
}

// If .env is configured correctly, get on with the rest of the program.

import express from "express";

import { portalRouter } from "./routes/portal";
import { quotesRouter } from "./routes/quotes";
import { registerRouter } from "./routes/register";

const app = express();
app.set("trust proxy", true);

app.use("/quotes", quotesRouter);
app.use("/register", registerRouter);
app.use("/portal", portalRouter);

const port =
  process.env.NODE_ENV === "development"
    ? 3000
    : Number(process.env.PRODUCTION_PORT);
app.listen(port, "localhost");
console.log(`Listening on http://localhost:${port}`);
