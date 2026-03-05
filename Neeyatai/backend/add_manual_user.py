import os
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
from users.utils import hash_password

# Load environment variables
load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/kickload_tool")
mongo_db_name = os.getenv("MONGO_DB_NAME", "kickload_tool")

client = MongoClient(mongo_uri)
db = client[mongo_db_name]
users_collection = db["users"]

# User details
email = "connect2rachit882@gmail.com"
password_raw = "Rachit@12"
full_name = "Rachit"
created_at = datetime.utcnow()
paid_ends_at = created_at + timedelta(days=180)  # 6 months

# Check if user exists
existing_user = users_collection.find_one({"email": email})
if existing_user:
    print(f"User {email} already exists. Updating subscription...")
    users_collection.update_one(
        {"email": email},
        {
            "$set": {
                "password": hash_password(password_raw),
                "paid_ends_at": paid_ends_at,
                "is_verified": True,
                "deleted": False
            }
        }
    )
    print("User updated successfully.")
else:
    print(f"Creating new user {email}...")
    new_user = {
        "email": email,
        "password": hash_password(password_raw),
        "name": full_name,
        "mobile": "",
        "organization": "Manual Entry",
        "organization_type": "Other",
        "country": "India",
        "created_at": created_at,
        "trial_ends_at": created_at + timedelta(days=15),
        "paid_ends_at": paid_ends_at,
        "is_verified": True,
        "deleted": False,
        "additional_emails": [],
    }
    
    try:
        users_collection.insert_one(new_user)
        print("User created successfully.")
    except Exception as e:
        print(f"Error creating user: {e}")

print("Done.")
