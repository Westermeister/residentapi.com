# 2021.11.16

- Moved from generated identity and secret keys to user-generated username and password combinations.
  - Changed format of API calls to use the Basic Authentication scheme.
  - Updated the documentation and sign-up form as necessary.
- Added a user account portal where the user can change their email, password, or delete their account.
- Split former `validateUserRequest` middleware into two middlewares: `authenticateUser` and `rateLimit`.
- Updated database schemas.
  - Added prefixes to generic primary key names.
    - For quote database: `id` to `quote_id`
    - For user database: `id` to `user_id`
  - User database now uses a text primary key i.e. the username.
  - Adjusted column names in user database to accomodate the new username-and-password scheme.
- Modified table of quotes.
  - Added a new quote for Leon from Resident Evil: Damnation.
  - Fixed spacing typo in an Ada Wong quote from Resident Evil 2 Remake.
- Several other minor refactors and additions to the code, including but not limited to:
  - Updating docstrings.
  - Changing casing of SQL statements for readability.
  - Updating old tests and adding new ones.

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
