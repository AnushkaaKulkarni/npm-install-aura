# RozgarLink API

The API stores accounts in MongoDB and exposes cookie-based authentication for the frontend.

## Start locally

1. Keep your real MongoDB URI and JWT secret in `backend/.env`; do not commit that file.
2. Set `GEMINI_INTERVIEW_API_KEY` in `backend/.env` to enable AI-powered interview practice, audio transcription and reports. The optional `GEMINI_INTERVIEW_MODEL` setting defaults to `gemini-2.5-flash`. Keep the key on the backend; do not add it to a `NEXT_PUBLIC_*` variable or the frontend `.env.local`.
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
│   ├── applicationController.js # Employer application review and status updates
│   ├── candidateController.js  # Candidate dashboard, profile, saved jobs, and applications
│   ├── healthController.js     # API health handler
│   ├── jobController.js        # Public job listings and employer job management
│   └── profileController.js    # Employer company profile updates
├── middlewares/
│   ├── authenticate.js         # JWT session authentication
│   ├── authRateLimiter.js      # Signup/login rate limit
│   ├── errorHandler.js         # Central API error responses
│   └── notFoundHandler.js      # Unknown endpoint response
├── models/
│   ├── Job.js                  # MongoDB job posting model
│   ├── Application.js          # Candidate applications and hiring status
│   ├── InterviewSession.js     # Persisted interview questions, transcripts and reports
│   └── User.js                 # Mongoose user, candidate profile, and company profile
├── routes/
│   ├── jobRoutes.js            # Public job listings and authenticated employer routes
│   ├── candidateRoutes.js      # Candidate-only dashboard, profile, application, and saved-job APIs
│   ├── authRoutes.js           # Authentication route definitions
│   └── healthRoutes.js         # Health route definitions
├── services/
│   ├── candidateSkillAnalysis.js # Profile-based role gap and practice-path analysis
│   └── candidateAnalysisPreview.js # Non-persisted sample profile and job fixtures
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
- `GET /api/jobs/applications` lists applications for the authenticated employer's own job postings.
- `PATCH /api/jobs/applications/:applicationId` updates an application status only when the application belongs to one of that employer's jobs.
- `GET /api/candidate/dashboard` returns the authenticated candidate's saved profile completion, experience eligibility, skill matches, saved jobs, and applications.
- `GET /api/candidate/profile` and `PATCH /api/candidate/profile/:section` retrieve and independently save the authenticated candidate's profile sections.
- `GET /api/candidate/skill-gap-analysis` compares saved skill, project, and work-experience evidence with active job requirements for saved target roles; it also returns role-specific practice plans and estimated skill-coverage changes.
- `GET /api/candidate/skill-gap-analysis/preview` returns explicitly labeled sample profile/job analysis for testing and never writes to the signed-in candidate's account.
- `GET /api/candidate/applications` and `POST /api/candidate/applications` list and persist candidate applications; a candidate can apply only once to a job.
- `GET /api/candidate/saved-jobs`, `PUT /api/candidate/saved-jobs/:jobId`, and `DELETE /api/candidate/saved-jobs/:jobId` manage saved active opportunities.
- Candidate identity for these APIs is always taken from the authenticated session cookie. Resume fields store metadata and an existing link only; file upload requires separately configured secure storage.
- `POST /api/interviews/question` generates one role-specific question for an authenticated candidate.
- `POST /api/interviews/answer` evaluates an interview answer and returns coaching feedback for an authenticated candidate.
- `POST /api/interviews/sessions` creates a saved interview session and generates its first question.
- `GET /api/interviews/sessions/:id` retrieves the candidate's own saved session and report.
- `POST /api/interviews/sessions/:id/transcribe` transcribes a WAV recording using Gemini's audio input.
- `POST /api/interviews/sessions/:id/answer` evaluates and persists an edited transcript before question progression.
- `POST /api/interviews/sessions/:id/next` advances only after the current answer has been saved and assessed.
- `POST /api/interviews/sessions/:id/finish` creates and saves the final report.
- `GET /api/interviews/sessions/mine` lists the candidate's recent reports.
- Audio recording is explicit and is not saved to MongoDB. The original speech transcript and candidate-edited answer are saved with per-answer AI scores. Confidence and delivery are not scored because the implementation does not analyze voice or video.
- Job postings store experience as minimum/maximum whole years and annual package as optional minimum/maximum LPA values. Public listings render these as explicit ranges (for example, `0–3 years` and `₹6–9 LPA`); older text-based ranges remain readable.
- `GET /health` reports API and MongoDB connection status.

Signup requires contact details and a role-specific profile. New accounts are stored with `verificationStatus: "pending"`; the API does not claim to verify identity or send email until a verification provider is configured.
