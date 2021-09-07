/**
 * Initialize backend routes.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

import { config } from "dotenv";
config({ path: "./.env" });

import express from "express";

import { quotesRouter } from "./routes/quotes";
import { registerRouter } from "./routes/register";

const app = express();
app.set("trust proxy", true);

app.use("/quotes", quotesRouter);
app.use("/register", registerRouter);

app.listen(Number(process.env.PORT), "localhost");
console.log(`Listening on http://localhost:${process.env.PORT}`);
