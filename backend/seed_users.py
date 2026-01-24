from sqlmodel import Session, select
from database import engine
from models import User, Role, Program, Section, Enrollment
from auth import get_password_hash
import traceback

def seed_users():
    try:
        with Session(engine) as session:
            # 1. Get Academic Entities (Must run seed_academic.py first)
            print("Fetching academic entities...")
            bscs = session.exec(select(Program).where(Program.code == "BSCS")).first()
            if not bscs:
                print("WARNING: BSCS Program not found. Run seed_academic.py first.")
                return

            section_a = session.exec(select(Section).where(Section.name == "Section A")).first()
            if not section_a:
                print("WARNING: Section A not found. Run seed_academic.py first.")
                return

            # Define users to seed
            users_to_seed = [
                {
                    "email": "admin@lms.com",
                    "full_name": "Admin User",
                    "password": "admin123",
                    "role": Role.admin,
                    "program_id": None
                },
                {
                    "email": "teacher@lms.com",
                    "full_name": "Teacher User",
                    "password": "teacher123",
                    "role": Role.teacher,
                    "program_id": None
                },
                {
                    "email": "student@lms.com",
                    "full_name": "Student User",
                    "password": "student123",
                    "role": Role.student,
                    "program_id": bscs.id
                }
            ]

            for user_data in users_to_seed:
                print(f"Processing {user_data['email']}...")
                statement = select(User).where(User.email == user_data["email"])
                existing_user = session.exec(statement).first()

                if existing_user:
                    print(f"User {user_data['email']} exists. Updating...")
                    existing_user.hashed_password = get_password_hash(user_data["password"])
                    existing_user.role = user_data["role"]
                    existing_user.program_id = user_data["program_id"]
                    session.add(existing_user)
                else:
                    print(f"Creating user {user_data['email']}...")
                    try:
                        p_hash = get_password_hash(user_data["password"])
                        new_user = User(
                            email=user_data["email"],
                            full_name=user_data["full_name"],
                            hashed_password=p_hash,
                            role=user_data["role"],
                            program_id=user_data["program_id"]
                        )
                        session.add(new_user)
                        session.commit() # Commit needed to get ID
                        session.refresh(new_user)
                        existing_user = new_user # For assignments below
                    except Exception as e:
                        print(f"Error creating {user_data['email']}: {e}")
                        continue
            
                # --- Assignments ---
                if user_data["role"] == Role.teacher and existing_user:
                    # Assign Teacher to Section A
                    print(f"Assigning {user_data['email']} to {section_a.name}...")
                    section_a.teacher_id = existing_user.id
                    session.add(section_a)

                if user_data["role"] == Role.student and existing_user:
                    # Enroll Student in Section A
                    enrollment = session.exec(select(Enrollment).where(Enrollment.student_id == existing_user.id).where(Enrollment.section_id == section_a.id)).first()
                    if not enrollment:
                        print(f"Enrolling {user_data['email']} in {section_a.name}...")
                        enrollment = Enrollment(student_id=existing_user.id, section_id=section_a.id)
                        session.add(enrollment)
            
            session.commit()
            print("User seeding completed successfully!")
    except Exception as e:
        print(f"Global Error: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    seed_users()
