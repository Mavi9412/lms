import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_registration_flow():
    # 1. Fetch Programs
    print("\n--- 1. Fetching Programs ---")
    try:
        response = requests.get(f"{BASE_URL}/academic/programs")
        print(f"Status: {response.status_code}")
        programs = response.json()
        print(f"Programs Found: {len(programs)}")
        if len(programs) > 0:
             print(f"Sample: {programs[0]['name']} (ID: {programs[0]['id']})")
             program_id = programs[0]['id']
        else:
            print("❌ No programs found! Cannot proceed.")
            return
    except Exception as e:
        print(f"❌ Failed to fetch programs: {e}")
        return

    # 2. Register New Student linked to Program
    print("\n--- 2. Registering Student with Program ---")
    timestamp = int(time.time())
    new_student = {
        "full_name": "New Student",
        "email": f"newstudent_{program_id}_{timestamp}@lms.com",
        "password": "password123",
        "role": "student",
        "program_id": program_id
    }
    
    try:
        url = f"{BASE_URL}/auth/signup"
        response = requests.post(url, json=new_student)
        print(f"Signup Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data['program_id'] == program_id:
                print("✅ Signup SUCCESS: Student linked to Program correctly.")
            else:
                print(f"❌ Signup WARNING: Program ID mismatch. Expected {program_id}, got {data.get('program_id')}")
        else:
            print(f"❌ Signup FAILED")
            
    except Exception as e:
        print(f"❌ Failed during signup: {e}")

if __name__ == "__main__":
    test_registration_flow()
