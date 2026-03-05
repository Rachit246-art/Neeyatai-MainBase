import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("Testing with gemini-2.0-flash...")

try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    response = model.generate_content("Generate a simple JMeter XML test plan for http://example.com with 10 users. Output only XML in ```xml``` block.")
    
    print(f"\n✓ SUCCESS! Response received!")
    print(f"Response length: {len(response.text)} characters")
    print(f"\nFirst 500 characters:")
    print(response.text[:500])
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
