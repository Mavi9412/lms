from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from database import engine
from routers import auth, courses, academic, assignments, admin, attendance, password_reset, gradebook, quizzes, rubrics

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(title="College LMS API", lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(password_reset.router)
app.include_router(courses.router)
app.include_router(academic.router)
app.include_router(assignments.router)
app.include_router(admin.router)
app.include_router(attendance.router)
app.include_router(gradebook.router)
app.include_router(quizzes.router)
app.include_router(rubrics.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to College LMS API"}
