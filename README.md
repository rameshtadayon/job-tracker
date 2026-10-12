# Job Tracker

A personal web app for tracking job applications: the companies and roles you're pursuing, where each one stands, notes and interview prep, and the contacts you've met along the way.

**Live:** https://rtk-job-tracker.netlify.app

## Features

- Track applications through statuses: Saved → Applied → Interviewing → Offer / Rejected / Withdrawn
- Store job URL, location, salary, applied date, and general / company / interview-prep notes
- Attach contacts to each application
- Email + password login; each user sees only their own data

## Tech stack

| Layer    | Tech                                                  | Hosted on |
| -------- | ----------------------------------------------------- | --------- |
| Frontend | React 19, TypeScript, Vite, React Router              | Netlify   |
| Backend  | FastAPI, SQLAlchemy, Argon2 password hashing          | Fly.io    |
| Database | PostgreSQL (SQLite locally by default)                | Neon      |

Netlify proxies `/api/*` to the Fly backend, so the browser sees a single origin and the session cookie just works.

## Project layout

```
backend/
  app/
    main.py            API routes
    auth.py            login sessions and password hashing
    models.py          SQLAlchemy models (User, Application, Contact)
    schemas.py         Pydantic request/response schemas
    crud.py            database operations
    database.py        engine setup (reads DATABASE_URL)
    create_user.py     CLI to create a user or reset a password
    migrate_sqlite.py  one-off copy of the old SQLite data into Postgres
  Dockerfile, fly.toml
frontend/
  src/                 React app (pages/, forms, API client)
netlify.toml           Netlify build + API proxy config
```

## Running locally

### Backend

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/python -m app.create_user          # create a login
venv/bin/uvicorn app.main:app --reload       # http://localhost:8000
```

Without `DATABASE_URL` set, the backend uses a local SQLite file (`backend/dev.db`). To use Postgres, put `DATABASE_URL="postgresql+psycopg://..."` in `backend/.env` (it's gitignored) and export it before running.

### Frontend

```bash
cd frontend
npm install
npm run dev                                  # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:8000`.

## Deployment

- **Frontend:** Netlify builds automatically from `main` using `netlify.toml`.
- **Backend:** from `backend/`, run
  ```bash
  fly deploy --ha=false --remote-only
  ```
  `DATABASE_URL` is set as a Fly secret, never committed.
- **Database:** Neon Postgres. Tables are created on startup with `create_all`, which doesn't alter existing tables, so schema changes need a manual migration.
