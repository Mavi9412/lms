from sqlmodel import SQLModel, create_engine, Session
from decouple import config

# Never hardcode credentials here. Local development defaults to a SQLite
# file; set DATABASE_URL for Postgres (e.g. on Render).
DATABASE_URL = config("DATABASE_URL", default="sqlite:///./lms.db")

# Fix for Render/Heroku postgres URLs usually starting with postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    # Needed because FastAPI serves requests from a thread pool
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def get_session():
    with Session(engine) as session:
        yield session
