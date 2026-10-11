# RozgarLink API

The API stores accounts in MongoDB and exposes cookie-based authentication for the frontend.

## Start locally

1. Keep your real MongoDB URI and JWT secret in `backend/.env`; do not commit that file.
2. Set `MONGO_DB_NAME` to the database to use (defaults to `rozgarlink`).
3. Install dependencies with `npm install`.
4. Run `npm run dev` from this directory.

The frontend's `NEXT_PUBLIC_API_URL` should point to the API prefix, for example `http://localhost:5000/api`.

## Project structure

```text
backend/
├── app.js                      # Express configuration and middleware registration
├── server.js                   # Environment loading, database connection, and startup
├── config/
│   └── database.js             # MongoDB connection helper
├── controllers/
│   ├── authController.js       # Signup, login, logout, and current-user handlers
│   └── healthController.js     # API health handler
├── middlewares/
│   ├── authenticate.js         # JWT session authentication
│   ├── authRateLimiter.js      # Signup/login rate limit
│   ├── errorHandler.js         # Central API error responses
│   └── notFoundHandler.js      # Unknown endpoint response
├── models/
│   └── User.js                 # Mongoose user model
├── routes/
│   ├── authRoutes.js           # Authentication route definitions
│   └── healthRoutes.js         # Health route definitions
└── utils/
    ├── auth.js                 # Session cookies and public user serialization
    ├── corsOptions.js          # Allowed frontend origins
    └── validateSignup.js       # Role-specific signup validation
```

## Authentication endpoints

- `POST /api/auth/signup` creates a candidate, employer, or training-provider account and sets an HTTP-only session cookie.
- `POST /api/auth/login` validates an email and password and sets the session cookie.
- `POST /api/auth/logout` clears the session cookie.
- `GET /api/auth/me` returns the current account when the cookie is valid.
- `GET /health` reports API and MongoDB connection status.

Signup requires contact details and a role-specific profile. New accounts are stored with `verificationStatus: "pending"`; the API does not claim to verify identity or send email until a verification provider is configured.
