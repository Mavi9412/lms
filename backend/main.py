from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel
from .database import engine
from .routers import auth, courses

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(title="College LMS API", lifespan=lifespan)

app.include_router(auth.router)
app.include_router(courses.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to College LMS API"}
