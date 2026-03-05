import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Connect to MongoDB
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/kickload_tool")
mongo_db_name = os.getenv("MONGO_DB_NAME", "kickload_tool")

client = MongoClient(mongo_uri)
db = client[mongo_db_name]
promo_codes = db["promo_codes"]

# Coupon Details
code = "FIRST10"
discount_percent = 40
max_uses = 10

promo_data = {
    "code": code,
    "discount_percent": discount_percent,
    "active": True,
    "max_uses": max_uses,
    "current_uses": 0,
    "description": "40% off for the first 10 users!"
}

# Upsert the coupon
result = promo_codes.update_one(
    {"code": code},
    {"$set": promo_data},
    upsert=True
)

if result.upserted_id:
    print(f"Coupon {code} created successfully.")
else:
    print(f"Coupon {code} updated successfully.")
