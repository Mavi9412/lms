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

### ⚡ One-Click University Demo Data (Seed Script)
Kisi bhi naye computer par complete university dummy data (2 Departments, Programs, Semesters, Courses, Allocations, Materials, Submissions, Grades, Attendance, Quizzes) populate karne ke liye sirf yeh command chalayein:
```bash
python seed.py
```
*(Ya backend directory se: `cd backend && python seed.py`)*

## 📚 Project Documentation & Viva Guides
- **English Project Report & 15-Slide Presentation Kit**: [docs/PROJECT_DOCUMENTATION_AND_PPT_GUIDE.md](docs/PROJECT_DOCUMENTATION_AND_PPT_GUIDE.md)
- **Roman Urdu Detailed & Simple Guide**: [docs/PROJECT_GUIDE_ROMAN_URDU.md](docs/PROJECT_GUIDE_ROMAN_URDU.md)
- **UI Screenshots (33+ HD Screenshots)**: [docs/screenshots/](docs/screenshots/)

## 🔑 Ready-to-Use Test Accounts

| Role | Name / Department | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@lms.com` | `admin123` |
| **Teacher** | Dr. Sarah Jenkins (CS) | `teacher@lms.com` | `teacher123` |
| **Teacher** | Prof. Tariq Mahmood (CS) | `prof.tariq@lms.com` | `password123` |
| **Teacher** | Dr. Ayesha Malik (EE) | `dr.ayesha@lms.com` | `password123` |
| **Teacher** | Dr. Bilal Khan (CS) | `dr.bilal@lms.com` | `password123` |
| **Student** | John Doe (CS) | `student@lms.com` | `student123` |
| **Student** | Ali Ahmed (CS) | `ali.ahmed@lms.com` | `password123` |
| **Student** | Sara Khan (CS) | `sara.khan@lms.com` | `password123` |
| **Student** | Usman Raza (EE) | `usman.raza@lms.com` | `password123` |
| **Student** | Fatima Noor (EE) | `fatima.noor@lms.com` | `password123` |
