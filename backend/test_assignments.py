import requests
import datetime

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@lms.com"
ADMIN_PASS = "admin123"
STUDENT_EMAIL = "student@lms.com"
STUDENT_PASS = "student123"

def get_token(email, password):
    resp = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if resp.status_code != 200:
        print(f"❌ Failed login for {email}: {resp.text}")
        return None
    return resp.json()["access_token"]

def test_assignments():
    print("\n--- Testing Assignments ---")
    
    # 1. Login as Admin/Teacher
    admin_token = get_token(ADMIN_EMAIL, ADMIN_PASS)
    student_token = get_token(STUDENT_EMAIL, STUDENT_PASS)
    if not admin_token or not student_token: return

    # 2. Search for a Course (CS-101)
    # We need to find its ID.
    courses_resp = requests.get(f"{BASE_URL}/courses/", headers={"Authorization": f"Bearer {admin_token}"})
    courses = courses_resp.json()
    if not courses:
        print("❌ No courses found.")
        return
    course_id = courses[0]["id"]
    print(f"Using Course ID: {course_id}")

    # 3. Create Assignment (Admin)
    print("\n--- Creating Assignment ---")
    assignment_data = {
        "title": "Build a Calculator",
        "description": "Create a simple calculator in Python.",
        "due_date": (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat(),
        "max_points": 100,
        "course_id": course_id
    }
    resp = requests.post(
        f"{BASE_URL}/assignments/", 
        json=assignment_data, 
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    print(f"Create Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"❌ Failed: {resp.text}")
        return
    assignment_id = resp.json()["id"]
    print(f"✅ Assignment Created (ID: {assignment_id})")

    # 4. Submit Assignment (Student)
    print("\n--- Submitting Assignment ---")
    sub_data = {"content": "https://github.com/student/calculator"}
    resp = requests.post(
        f"{BASE_URL}/assignments/{assignment_id}/submit",
        json=sub_data,
        headers={"Authorization": f"Bearer {student_token}"}
    )
    print(f"Submit Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"❌ Failed: {resp.text}")
    else:
        print("✅ Submission Successful")
        sub_id = resp.json()["id"]

        # 5. Grade Submission (Admin)
        print("\n--- Grading Submission ---")
        grade_data = {"grade": 95.5, "feedback": "Great work!"}
        resp = requests.post(
            f"{BASE_URL}/assignments/submissions/{sub_id}/grade",
            json=grade_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Grade Status: {resp.status_code}")
        if resp.status_code == 200:
            print("✅ Grading Successful")

if __name__ == "__main__":
    test_assignments()
