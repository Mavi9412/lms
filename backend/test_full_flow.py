import requests

def test_full_login_flow(email, password):
    base_url = "http://localhost:8000"
    
    # Step 1: Get Token
    print(f"\n--- 1. Requesting Token for {email} ---")
    token_url = f"{base_url}/auth/token"
    payload = {
        "username": email,
        "password": password
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    try:
        response = requests.post(token_url, data=payload, headers=headers)
        print(f"Token Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Failed to get token: {response.text}")
            return

        data = response.json()
        access_token = data.get("access_token")
        print(f"✅ Got Access Token: {access_token[:20]}...")

        # Step 2: Get Profile
        print(f"\n--- 2. Requesting Profile /auth/me ---")
        me_url = f"{base_url}/auth/me"
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        
        me_response = requests.get(me_url, headers=auth_headers)
        print(f"Profile Status: {me_response.status_code}")
        print(f"Profile Response: {me_response.text}")

        if me_response.status_code == 200:
            print("✅ Full Flow SUCCESS")
        else:
            print("❌ Full Flow FAILED at /auth/me")

    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_full_login_flow("admin@lms.com", "admin123")
