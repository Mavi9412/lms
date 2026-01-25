from sqlmodel import Session, select
from database import engine
from models import User, Role
from auth import get_password_hash

def create_admin():
    with Session(engine) as session:
        # Check if admin exists
        admin = session.exec(select(User).where(User.email == "admin@lms.edu")).first()
        if admin:
            print("Admin user already exists.")
            return

        admin = User(
            email="admin@lms.edu",
            full_name="System Administrator",
            role=Role.admin,
            hashed_password=get_password_hash("admin123")
        )
        session.add(admin)
        session.commit()
        print("Admin user created: admin@lms.edu / admin123")

if __name__ == "__main__":
    create_admin()
