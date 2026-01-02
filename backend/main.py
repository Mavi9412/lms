from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlmodel import SQLModel

# Placeholder for database import
# from .database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(title="College LMS API", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Welcome to College LMS API"}
