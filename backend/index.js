/**
 * Initialize backend routes.
 * Copyright (c) 2021 Westermeister. All rights reserved.
 */

require("dotenv").config({ path: "../.env" });

const express = require("express");

const quotes = require("./routes/quotes");
const register = require("./routes/register");

const app = express();
app.set("trust proxy", true);

app.use("/quotes", quotes);
app.use("/register", register);

app.listen(process.env.PORT, "localhost");
