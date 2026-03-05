import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key}")
print(f"Key length: {len(api_key)}")

# Try direct API call with google-generativeai library
try:
    import google.generativeai as genai
    
    genai.configure(api_key=api_key)
    
    print("\n✓ Configured google.generativeai")
    
    # List available models
    print("\nAvailable models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
    
    # Try a simple generation
    print("\nTesting generation with gemini-1.5-flash...")
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    response = model.generate_content("Say 'Hello World' in XML format")
    print(f"\n✓ Response received!")
    print(f"Response: {response.text[:200]}")
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
