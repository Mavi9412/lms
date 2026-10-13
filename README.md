# College LMS

[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-61DAFB?style=flat-square)](https://react.dev/)
[![SQLModel](https://img.shields.io/badge/ORM-SQLModel-ff4d4d?style=flat-square)](https://sqlmodel.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

A full-stack, role-based **Learning Management System** for colleges and training institutes. Admins manage the academic structure and users, teachers run courses end-to-end (content, assignments, quizzes, attendance, grading), and students learn, submit work, and track their progress — all in one place.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Seed Data](#seed-data)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Course Management
- Full academic hierarchy: **departments → programs → batches → semesters → courses → sections**
- Course approval & publishing workflow (admin approves, teacher publishes)
- Lessons with create / edit / delete, ordered content
- File material uploads (PDF, slides, video) served from the API
- Student enrollment per section

### Assignments
- Teachers create assignments with due dates and max points
- Students submit text and/or file uploads
- Grading with numeric scores + written feedback
- **Rubric-assisted grading** — the course rubric is shown as a reference inside the grading modal

### Quizzes
- MCQ and True/False questions with per-question points
- Time limits, max attempts, availability windows, passing scores
- Automatic grading on submit, attempt history, results review
- **Quiz scores flow into the gradebook** — each student's best attempt counts toward the final grade

### Rubrics
- Teachers define reusable grading rubrics per course (criteria + max points each)
- Students see rubrics read-only on the course page, so expectations are transparent

### Attendance
- Per-section, per-date marking (present / absent / late)
- Per-student summaries, section reports, record correction
- Configurable attendance policy (minimum percentage, late tolerance)

### Gradebook & Final Grades
- Per-course grade matrix: every assignment and quiz column, per-student totals and percentages
- Best quiz attempt counted automatically
- One-click **Publish Final Grades** — letter grades computed from the admin-defined grading scale (with a standard A–F fallback) and written to enrollments, audit-logged
- CSV export

### Communication
- Course announcements (pinnable) with rich-text content
- Discussion forums: threads, replies, upvotes

### Notifications
- Typed in-app notifications (assignment created/graded, quiz created/graded, announcements, discussion replies) with unread counts and a notification bell

### Administration
- User management (create / edit / activate / delete, role assignment)
- Academic structure management and teacher↔section allocation
- Attendance policy and grading-scale configuration
- Audit log of sensitive actions (e.g. grade publishing)
- Dashboard statistics

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide icons |
| Backend  | FastAPI, SQLModel (SQLAlchemy + Pydantic v2), python-jose (JWT), Passlib |
| Database | SQLite for local development · PostgreSQL in production (`DATABASE_URL`) |
| Email    | SMTP (password reset); all other mail config optional |

---

## Architecture

```
┌─────────────────────────────┐
│  React + Vite SPA (port 5173)│
│  role-based routes & layouts │
└──────────────┬──────────────┘
               │  REST + JWT (Axios)
               ▼
┌─────────────────────────────┐
│  FastAPI (port 8000)         │
│  /auth /courses /assignments │
│  /quizzes /attendance        │
│  /gradebook /rubrics ...     │
└──────────────┬──────────────┘
               │  SQLModel
               ▼
┌─────────────────────────────┐
│  SQLite (dev) / PostgreSQL   │
│  + uploads/ static files     │
└─────────────────────────────┘
```

All datetimes are timezone-aware UTC throughout the stack; naive ISO strings from the UI (e.g. `datetime-local` inputs) are interpreted as UTC.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optional — see Configuration
uvicorn main:app --reload
```

The API runs at `http://localhost:8000` (interactive docs at `/docs`). Without a `.env`, it uses a local SQLite file (`lms.db`) and an ephemeral dev `SECRET_KEY`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and expects the API at `http://localhost:8000` (override with `VITE_API_URL`).

### 3. First login

Seed demo data (admin, teachers, students, academic structure):

```bash
cd backend
python seed_academic.py   # departments, programs, batches, semesters, sections
python seed_users.py      # users + enrollments
```

Or register via the UI — the first registered user can be promoted to admin directly in the database, or use `create_admin.py`.

---

## Configuration

All backend settings come from environment variables (see `backend/.env.example`):

| Variable        | Default                  | Description |
|-----------------|--------------------------|-------------|
| `DATABASE_URL`  | `sqlite:///./lms.db`     | Postgres URL in production, e.g. `postgresql://user:pass@host:5432/db` (`postgres://` is auto-fixed) |
| `SECRET_KEY`    | *(ephemeral dev key)*     | Long random string for JWT signing — **required in production** |
| `SMTP_HOST`     | `smtp.gmail.com`          | SMTP server for password-reset emails |
| `SMTP_PORT`     | `587`                    | SMTP port |
| `EMAIL_USER` / `EMAIL_PASSWORD` | *(empty)*   | SMTP credentials; when unset, reset emails are logged instead of sent |
| `FROM_EMAIL` / `FROM_NAME` | *(defaults)*      | Sender identity |
| `FRONTEND_URL`  | `http://localhost:5173`  | Used to build password-reset links |

Frontend:

| Variable       | Default                 | Description |
|----------------|-------------------------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |

---

## Seed Data

| Script | Purpose |
|--------|---------|
| `seed_academic.py` | Departments, programs, batches, semesters, sections |
| `seed_users.py` | Demo admin / teacher / student accounts + enrollments (run after `seed_academic.py`) |
| `create_admin.py` | Promote/create an admin user |

---

## API Reference

Base URL: `http://localhost:8000`. Authenticated routes expect `Authorization: Bearer <JWT>`.

| Prefix | Description |
|--------|-------------|
| `POST /auth/signup` · `POST /auth/token` · `GET /auth/me` | Registration, JWT login, profile (password hashes are never exposed) |
| `POST /forgot-password` · `POST /reset-password` | Password reset via email token |
| `/courses` | Course CRUD, approval/publish, lessons, material upload/download, enrollment |
| `/academic` | Departments, programs, semesters, sections (read) |
| `/admin` | Users, departments/programs/batches/semesters/sections management, teacher allocation, policies, stats |
| `/teacher` | Teacher dashboard, own sections and students |
| `/assignments` | Assignment CRUD, submissions (text/file), grading with feedback |
| `/quizzes` | Quiz CRUD, attempt start/submit (auto-graded), attempts & results |
| `/rubrics` | Rubric + criteria CRUD per course |
| `/attendance` | Mark attendance, records, per-student summaries, reports |
| `/gradebook/course/{id}` | Grade matrix (assignments + quizzes) |
| `POST /gradebook/course/{id}/publish` | Publish final letter grades to enrollments |
| `/announcements` | Course announcements (pin/unpin) |
| `/discussions` | Threads, replies, upvotes |
| `/notifications` | List, unread count, mark read |

---

## Roles & Permissions

| Capability | Admin | Teacher | Student |
|------------|:-----:|:-------:|:-------:|
| Manage users & academic structure | ✅ | ❌ | ❌ |
| Approve / publish courses | ✅ | ❌ | ❌ |
| Create lessons, materials, assignments, quizzes, rubrics | ❌ | ✅ (own courses) | ❌ |
| Mark attendance | ❌ | ✅ (own sections) | ❌ |
| Grade submissions | ❌ | ✅ (own courses) | ❌ |
| View gradebook / publish final grades | ✅ | ✅ (own courses) | ❌ |
| Take quizzes, submit assignments | ❌ | ❌ | ✅ (enrolled) |
| View own grades & attendance | ❌ | ❌ | ✅ |
| Announcements / discussions | ✅ | ✅ | ✅ (participate) |

Route guards on the frontend mirror these rules; every sensitive endpoint re-checks the role server-side.

---

## Project Structure

```
lms/
├── backend/
│   ├── main.py              # FastAPI app, router registration, uploads mount
│   ├── database.py          # Engine + session (env-driven URL, sqlite dev default)
│   ├── auth.py              # JWT, password hashing, current-user dependencies
│   ├── models.py            # SQLModel tables + request/response schemas
│   ├── routers/             # One module per domain (auth, courses, quizzes, …)
│   ├── services/
│   │   └── email_service.py # SMTP sender (password reset)
│   ├── seed_academic.py / seed_users.py / create_admin.py
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/           # Landing, auth, student pages, teacher/*, admin/*
        ├── components/      # Layout, Navbar, modals, NotificationBell, …
        ├── layouts/         # AdminLayout, TeacherLayout (+ TeacherNav)
        ├── context/         # AuthContext (JWT + user in localStorage)
        └── services/api.ts  # Axios client with auth interceptor
```

---

## Deployment

**Backend (Render / Railway / VPS):**
1. Set `DATABASE_URL` to your Postgres URL and `SECRET_KEY` to a long random string.
2. Set `SMTP_*` / `EMAIL_*` if you want real password-reset emails.
3. Start with `uvicorn main:app --host 0.0.0.0 --port $PORT`. Tables are created automatically on startup.

**Frontend (Vercel / Netlify):**
1. Set `VITE_API_URL` to your deployed API URL.
2. Build with `npm run build`, serve `dist/`.

Make sure the backend's CORS origins include your frontend domain (see `main.py`).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `RuntimeError: Directory 'uploads' does not exist` | Fixed in code — the directory is auto-created on startup |
| `ValueError: Datetime values must have timezone information` | Fixed in code — the backend uses tz-aware UTC everywhere |
| Login works but pages redirect to `/login` | Check the API is reachable at `VITE_API_URL` and the token isn't expired (30 min default) |
| Password-reset email not received | Set `EMAIL_USER`/`EMAIL_PASSWORD`; without them the email is only logged server-side |
| `npm run build` fails on type errors | Run `npx tsc -b` to see them — the codebase is strict (`noUnusedLocals`) |

---

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feature/my-change`).
2. Keep backend changes covered by a quick manual API test and frontend changes building cleanly (`npm run build`).
3. Follow the existing code style (routers per domain, modals under `components/modals`).
4. Open a pull request describing the change.

---

## License

MIT — see [LICENSE](LICENSE).
