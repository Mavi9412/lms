from sqlmodel import Session, select
from database import engine
from models import User, Role
from auth import get_password_hash

def seed_users():
    with Session(engine) as session:
        # Define users to seed
        users_to_seed = [
            {
                "email": "admin@lms.com",
                "full_name": "Admin User",
                "password": "admin123",
                "role": Role.admin
            },
            {
                "email": "teacher@lms.com",
                "full_name": "Teacher User",
                "password": "teacher123",
                "role": Role.teacher
            },
            {
                "email": "student@lms.com",
                "full_name": "Student User",
                "password": "student123",
                "role": Role.student
            }
        ]

        for user_data in users_to_seed:
            statement = select(User).where(User.email == user_data["email"])
            existing_user = session.exec(statement).first()

            if existing_user:
                print(f"User {user_data['email']} exists. Updating password...")
                existing_user.hashed_password = get_password_hash(user_data["password"])
                existing_user.full_name = user_data["full_name"] # Update name just in case
                existing_user.role = user_data["role"] # Ensure role is correct
                session.add(existing_user)
            else:
                print(f"Creating user {user_data['email']}...")
                new_user = User(
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=get_password_hash(user_data["password"]),
                    role=user_data["role"]
                )
                session.add(new_user)
        
        session.commit()
        print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_users()
