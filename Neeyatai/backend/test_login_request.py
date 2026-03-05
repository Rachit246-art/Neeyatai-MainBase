import requests
import json

# Test login endpoint
url = "http://localhost:5000/login"
payload = {
    "email": "connect2rachit882@gmail.com",
    "password": "Rachit@12",
    "rememberMe": False
}

headers = {
    "Content-Type": "application/json"
}

print("Testing login endpoint...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("\n" + "="*50 + "\n")

try:
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"\nResponse Body:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        print("\n✓ Login successful!")
    else:
        print(f"\n✗ Login failed with status {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("✗ Connection Error: Cannot connect to backend server")
    print("  Make sure the backend is running on http://localhost:5000")
except Exception as e:
    print(f"✗ Error: {e}")
