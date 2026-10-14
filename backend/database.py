import os
from sqlmodel import SQLModel, create_engine, Session
from decouple import config

DATABASE_URL = config("DATABASE_URL", default="sqlite:///./lms.db") 

# If SQLite URL is relative, anchor it to the backend directory
if DATABASE_URL.startswith("sqlite:///./") or (DATABASE_URL.startswith("sqlite:///") and not os.path.isabs(DATABASE_URL.split("sqlite:///")[-1])):
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_name = DATABASE_URL.split("sqlite:///")[-1].lstrip("./")
    abs_db_path = os.path.join(backend_dir, db_name)
    DATABASE_URL = f"sqlite:///{abs_db_path.replace(os.sep, '/')}"

# Fix for Render/Heroku postgres URLs usually starting with postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=False)

def get_session():
    with Session(engine) as session:
        yield session
