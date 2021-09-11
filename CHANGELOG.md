# 2021.09.11

- Refactored how development servers are started.
  - They now use constant ports; `8080` for frontend and `3000` for backend.
- Backend entry point now has validation code to ensure that the `.env` file is configured correctly.
  - `NODE_ENV` is now a required variable.
  - Since backend development server now uses constant port, the `PORT` variable has been changed to an optional
    `PRODUCTION_PORT` variable that is only needed if `NODE_ENV` is set to a value other than `development`.

# 2021.09.10

- Slightly darkened color of links to fit the brand better.

# 2021.09.09

- First release!
