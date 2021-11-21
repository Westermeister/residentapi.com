# residentapi.com

This is the repository for [Resident API](https://residentapi.com).

In the root of the repository, you'll find configuration files for tools like npm, eslint, prettier, etc. You'll also
find directories leading to `src` and `tests`.

## src

The `src` directory, as the name implies, hosts the source code of Resident API. The code is split into two parts: the
frontend and the backend sections.

The `frontend` directory contains the web root; specifically, the HTML, SCSS, and JSX for rendering each of the
individual pages of the Resident API website. As is custom, it also contains a favicon, a sitemap, and a related
`robots.txt` file.

The `backend` directory contains the Express API, which is written with TypeScript and SQL. It contains, among other
things, bindings for an SQLite database, a CSV table from which to build that database, and associated middleware and
routes for handling API calls. The API allows for user registration, account management, and of course, serving quotes.
One critical aspect to all of this is user authentication, which is implemented via [HTTP Basic
Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication) through the `authenticateUser` middleware.
Additional security is provided by using a modern password hashing algorithm,
[Argon2](https://github.com/P-H-C/phc-winner-argon2), alongside Basic Auth.

## tests

The `tests` directory hosts unit tests written with [Jest](https://jestjs.io/). These tests cover user registration,
account management, rate limiting, and serving quotes. In addition, the tests also ensure that user authentication is
properly handled to prevent unauthorized access. Together, these tests cover the vast majority of the code.
