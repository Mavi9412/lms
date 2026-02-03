
import requests
import os

# Configuration
BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/auth/token"
UPLOAD_URL = f"{BASE_URL}/courses/{{}}/materials"

# Test Credentials (should exist from seeding)
EMAIL = "teacher@lms.com"
PASSWORD = "password123"

def verify_upload():
    # 1. Login
    print(f"Logging in as {EMAIL}...")
    response = requests.post(LOGIN_URL, data={"username": EMAIL, "password": PASSWORD})
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Get Courses to find a valid Course ID
    print("Fetching courses...")
    courses_response = requests.get(f"{BASE_URL}/courses/", headers=headers)
    if courses_response.status_code != 200:
        print(f"Failed to fetch courses: {courses_response.text}")
        return
    
    courses = courses_response.json()
    if not courses:
        print("No courses found. creating one...")
        # (Optional: create course logic here, but assuming one exists)
        return

    course_id = courses[0]["id"]
    print(f"Using Course ID: {course_id}")

    # 3. Upload File
    print("Uploading file...")
    dummy_file_content = b"This is a test course material file."
    files = {'file': ('test_material.txt', dummy_file_content, 'text/plain')}
    
    upload_res = requests.post(UPLOAD_URL.format(course_id), headers=headers, files=files)
    
    if upload_res.status_code == 200:
        print("Upload successful!")
        data = upload_res.json()
        print(f"Uploaded Material: {data}")
        material_id = data["id"]
        
        # 4. Verify in List
        print("Verifying in list...")
        list_res = requests.get(UPLOAD_URL.format(course_id), headers=headers)
        materials = list_res.json()
        found = any(m["id"] == material_id for m in materials)
        if found:
            print("File found in list.")
        else:
            print("File NOT found in list.")

        # 5. Clean up (Delete)
        print("Deleting file...")
        del_res = requests.delete(f"{UPLOAD_URL.format(course_id)}/{material_id}", headers=headers)
        if del_res.status_code == 200:
             print("Deletion successful.")
        else:
             print(f"Deletion failed: {del_res.text}")

    else:
        print(f"Upload failed: {upload_res.status_code} - {upload_res.text}")

if __name__ == "__main__":
    verify_upload()
