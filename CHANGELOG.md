# 2021.09.26

- Changed call-to-action button to use capital case i.e. changed from "Get started" to "Get Started".

# 2021.09.14

- Lift up `src` and `dist` directories above `frontend` and `backend` directories.
  - e.g. `frontend/src` becomes `src/frontend`.

# 2021.09.11.1

- Added warning prompt when executing `make clean`.
  - The prompt warns that cleaning will result in the removal of the production database i.e. `users.db`.

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
