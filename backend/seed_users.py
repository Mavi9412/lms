from sqlmodel import Session, select
from database import engine
from models import User, Role
from auth import get_password_hash
import traceback

def seed_users():
    try:
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
                print(f"Processing {user_data['email']}...")
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
                    try:
                        p_hash = get_password_hash(user_data["password"])
                        new_user = User(
                            email=user_data["email"],
                            full_name=user_data["full_name"],
                            hashed_password=p_hash,
                            role=user_data["role"]
                        )
                        session.add(new_user)
                    except Exception as e:
                        print(f"Error hashing password for {user_data['email']}: {e}")
                        traceback.print_exc()
                        raise e
            
            session.commit()
            print("Seeding completed successfully!")
    except Exception as e:
        print(f"Global Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    seed_users()
