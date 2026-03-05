import os
from pymongo import MongoClient
from dotenv import load_dotenv
from users.utils import check_password

# Load environment variables
load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/kickload_tool")
mongo_db_name = os.getenv("MONGO_DB_NAME", "kickload_tool")

client = MongoClient(mongo_uri)
db = client[mongo_db_name]
users_collection = db["users"]

# User details to check
email = "connect2rachit882@gmail.com"
password_to_test = "Rachit@12"

# Find user
user = users_collection.find_one({"email": email})

if user:
    print(f"✓ User found: {email}")
    print(f"  - Name: {user.get('name', 'N/A')}")
    print(f"  - Is Verified: {user.get('is_verified', False)}")
    print(f"  - Deleted: {user.get('deleted', False)}")
    print(f"  - Created At: {user.get('created_at', 'N/A')}")
    print(f"  - Trial Ends At: {user.get('trial_ends_at', 'N/A')}")
    print(f"  - Paid Ends At: {user.get('paid_ends_at', 'N/A')}")
    
    # Check password
    stored_password = user.get("password", "")
    if stored_password:
        password_match = check_password(password_to_test, stored_password)
        print(f"  - Password Match: {password_match}")
        if not password_match:
            print("    ⚠ Password does NOT match!")
    else:
        print("  - ⚠ No password stored in database!")
    
    # Check for any blocking conditions
    print("\nLogin Check:")
    if user.get("deleted"):
        print("  ✗ User is marked as deleted")
    elif not user.get("is_verified"):
        print("  ✗ Email is not verified")
    elif not stored_password:
        print("  ✗ No password set")
    elif not password_match:
        print("  ✗ Password does not match")
    else:
        print("  ✓ All checks passed - login should work!")
else:
    print(f"✗ User NOT found: {email}")
    print("\nPlease run add_manual_user.py to create the user.")
