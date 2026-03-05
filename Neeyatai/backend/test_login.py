import requests
import json

url = "http://localhost:5000/login"
payload = {
    "email": "connect2rachit882@gmail.com",
    "password": "Rachit@12"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
