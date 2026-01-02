# "College" LMS

A centralized Web-based Learning Management System.

## Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Database**: PostgreSQL

## Getting Started

### Backend
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
