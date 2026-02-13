# Initialize PostgreSQL Database with Tables
# Run this after setup_postgres.py creates the database

from sqlmodel import SQLModel
from database import engine
from models import *  # Import all models

def init_db():
    """Create all tables in PostgreSQL"""
    print("Creating all tables in PostgreSQL...")
    SQLModel.metadata.create_all(engine)
    print("✅ All tables created successfully!")
    print("\nYou can now:")
    print("1. Run seed scripts to add test data")
    print("2. Start the server: uvicorn main:app --reload --port 8000")

if __name__ == "__main__":
    init_db()
