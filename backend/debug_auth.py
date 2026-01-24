from sqlmodel import Session, select
from database import engine
from models import User
from auth import verify_password

def check_login(email, password):
    print(f"\n--- Checking {email} ---")
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        
        if not user:
            print("❌ User NOT FOUND in database.")
            return

        print(f"✅ User found: {user.email}")
        print(f"🔑 Stored Hash: {user.hashed_password[:20]}...")
        
        try:
            is_valid = verify_password(password, user.hashed_password)
            if is_valid:
                print("✅ Password verification PASSED")
            else:
                print("❌ Password verification FAILED")
        except Exception as e:
            print(f"❌ Error during verification: {e}")

if __name__ == "__main__":
    check_login("admin@lms.com", "admin123")
    check_login("student@lms.com", "student123")
