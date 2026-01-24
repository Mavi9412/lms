import requests

def test_api_login(email, password):
    url = "http://localhost:8000/auth/token"
    payload = {
        "username": email,
        "password": password
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    print(f"POST {url} with username={email}")
    try:
        response = requests.post(url, data=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ API Login SUCCESS")
        else:
            print("❌ API Login FAILED")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_api_login("admin@lms.com", "admin123")
