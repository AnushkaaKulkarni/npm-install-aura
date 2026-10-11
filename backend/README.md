# RozgarLink API

The API stores accounts in MongoDB and exposes cookie-based authentication for the frontend.

## Start locally

1. Keep your real MongoDB URI and JWT secret in `backend/.env`; do not commit that file.
2. Set `GROQ_API_KEY` in `backend/.env`. The key is used only by the backend and is never sent to the browser. `GROQ_MODEL` is optional and defaults to `llama-3.3-70b-versatile`.
3. Set `MONGO_DB_NAME` to the database to use (defaults to `rozgarlink`).
4. Install dependencies with `npm install`.
5. Run `npm run dev` from this directory.

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
│   ├── jobController.js        # Public job listings and employer job management
│   └── profileController.js    # Employer company profile updates
├── middlewares/
│   ├── authenticate.js         # JWT session authentication
│   ├── authRateLimiter.js      # Signup/login rate limit
│   ├── errorHandler.js         # Central API error responses
│   └── notFoundHandler.js      # Unknown endpoint response
├── models/
│   ├── Job.js                  # MongoDB job posting model
│   └── User.js                 # Mongoose user model and company profile
├── routes/
│   ├── jobRoutes.js            # Public job listings and authenticated employer routes
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
- `PATCH /api/auth/company-profile` updates the authenticated employer's company profile.
- `GET /api/jobs` lists active, unexpired job postings for candidates.
- `GET /api/jobs/mine` lists the authenticated employer's postings.
- `POST /api/jobs` validates and stores an authenticated employer's job posting.
- Job postings store experience as minimum/maximum whole years and annual package as optional minimum/maximum LPA values. Public listings render these as explicit ranges (for example, `0–3 years` and `₹6–9 LPA`); older text-based ranges remain readable.
- `GET /health` reports API and MongoDB connection status.

## AI Career Assistant

The authenticated candidate API at `/api/assistant` stores conversations in MongoDB and scopes every read, write, and delete to the signed-in user. Groq requests run on the backend using `GROQ_API_KEY`. The assistant is instructed to stay within career and employment topics, use only profile facts actually stored for the account, and ask for missing target-role or skill information rather than inventing a gap analysis. It does not query job listings because this project currently has no persisted job-listing model.

Voice input uses the browser Web Speech recognition API (browser and microphone permission dependent). Spoken replies use the browser's speech synthesis voices; the selected language is also sent to Groq for text replies.

Signup requires contact details and a role-specific profile. New accounts are stored with `verificationStatus: "pending"`; the API does not claim to verify identity or send email until a verification provider is configured.
