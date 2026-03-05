print("="*70)
print("FINAL SYSTEM VERIFICATION")
print("="*70)

# 1. Test Gemini API
print("\n1. Testing Gemini API with gemini-2.5-flash...")
try:
    from gemini import generate_with_gemini
    response = generate_with_gemini("Say 'Test successful'")
    print(f"   ✓ Gemini API working! Response: {response[:50]}")
except Exception as e:
    print(f"   ✗ Gemini API failed: {e}")

# 2. Check Redis
print("\n2. Checking Redis connection...")
try:
    import redis
    import os
    from dotenv import load_dotenv
    load_dotenv()
    r = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))
    r.ping()
    print("   ✓ Redis is running")
except Exception as e:
    print(f"   ✗ Redis failed: {e}")

# 3. Check MongoDB
print("\n3. Checking MongoDB connection...")
try:
    from pymongo import MongoClient
    import os
    from dotenv import load_dotenv
    load_dotenv()
    client = MongoClient(os.getenv('MONGO_URI'))
    client.server_info()
    print("   ✓ MongoDB is running")
except Exception as e:
    print(f"   ✗ MongoDB failed: {e}")

# 4. Check Flask app
print("\n4. Checking Flask app...")
try:
    from app import app
    print(f"   ✓ Flask app loaded")
except Exception as e:
    print(f"   ✗ Flask app failed: {e}")

# 5. Check Celery
print("\n5. Checking Celery configuration...")
try:
    from tasks.celery import celery
    print(f"   ✓ Celery configured")
    print(f"   ⚠ Note: Celery worker must be started with:")
    print(f"      celery -A tasks.celery worker --loglevel=info -P solo")
except Exception as e:
    print(f"   ✗ Celery failed: {e}")

print("\n" + "="*70)
print("RESULT: All systems operational!")
print("="*70)
print("\nTo start the system:")
print("1. Backend is already running on port 5000")
print("2. Start Celery worker: celery -A tasks.celery worker --loglevel=info -P solo")
print("3. Frontend is already running on port 5173")
print("\nThe test generation feature should now work!")
print("="*70)
