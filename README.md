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

## 📚 Project Documentation & Viva Guides
- **English Project Report & 15-Slide Presentation Kit**: [docs/PROJECT_DOCUMENTATION_AND_PPT_GUIDE.md](docs/PROJECT_DOCUMENTATION_AND_PPT_GUIDE.md)
- **Roman Urdu Detailed & Simple Guide**: [docs/PROJECT_GUIDE_ROMAN_URDU.md](docs/PROJECT_GUIDE_ROMAN_URDU.md)
- **UI Screenshots**: [docs/screenshots/](docs/screenshots/)

## 🔑 Default Test Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@lms.com` | `admin123` |
| **Teacher** | `teacher@lms.com` | `teacher123` |
| **Student** | `student@lms.com` | `student123` |
