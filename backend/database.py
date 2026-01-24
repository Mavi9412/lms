from sqlmodel import SQLModel, create_engine, Session
from decouple import config

DATABASE_URL = config("DATABASE_URL", default="sqlite:///./test.db") 

# Fix for Render/Heroku postgres URLs usually starting with postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=False)

def get_session():
    with Session(engine) as session:
        yield session
