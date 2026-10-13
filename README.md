# "College" LMS

A centralized web-based Learning Management System with role-based
workflows for admins, teachers, and students.

## Features

- **Auth & roles** — JWT login/signup, password reset via email, admin / teacher / student roles with route guards
- **Academic structure** — departments → programs → batches → semesters → courses → sections, enrollments
- **Course content** — lessons (create/edit/delete), file materials, course approval & publishing
- **Assignments** — create, text/file submissions, grading with feedback
- **Quizzes** — MCQ & true/false, time limits, attempt limits, availability windows, auto-scoring
- **Rubrics** — teachers define grading criteria per course; shown as a reference while grading and read-only to students
- **Attendance** — per-section marking, records, per-student summaries, reports, attendance policy
- **Gradebook** — per-course grade matrix, CSV export, one-click **publish of final letter grades** (uses the admin grading scale)
- **Communication** — course announcements (pinnable) and discussion forums with replies & upvotes
- **Notifications** — typed in-app notifications with unread counts
- **Admin** — user management, stats, academic structure, teacher allocation, attendance/grading policies, audit log

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLModel (pydantic v2)
- **Database**: SQLite for local dev (`lms.db`), PostgreSQL via `DATABASE_URL` in production

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # fill in SECRET_KEY / DATABASE_URL / SMTP as needed
uvicorn main:app --reload # API at http://localhost:8000
```

Without a `.env`, the API runs on a local SQLite file with an ephemeral
`SECRET_KEY` (fine for development).

Seed demo data (optional):

```bash
python seed_users.py
python seed_academic.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev              # app at http://localhost:5173
```

The frontend expects the API at `http://localhost:8000` (override with
`VITE_API_URL`).

## Notes

- Timezone-aware UTC datetimes are used throughout; naive ISO strings from
  the UI (e.g. `datetime-local` inputs) are interpreted as UTC.
- Uploaded files are served from `backend/uploads/` (created automatically).
