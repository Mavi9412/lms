import requests
import json

url = "http://127.0.0.1:8000/auth/signup"
data = {
    "email": "testuser_debug@example.com",
    "full_name": "Test User Debug",
    "password": "password123",
    "role": "student"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
