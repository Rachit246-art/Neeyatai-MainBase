import os
from dotenv import load_dotenv
from gemini import generate_with_gemini

load_dotenv()

print("Testing Gemini API...")
print(f"API Key: {os.getenv('GEMINI_API_KEY')[:20]}...")

try:
    # Simple test prompt
    prompt = "Generate a minimal JMeter test plan XML for testing http://example.com with 10 users. Output only XML in ```xml``` block."
    
    print("\nSending test prompt to Gemini...")
    print(f"Prompt: {prompt[:100]}...")
    
    response = generate_with_gemini(prompt)
    
    print("\n✓ Gemini API Response received!")
    print(f"Response length: {len(response)} characters")
    print(f"First 200 chars: {response[:200]}")
    
    if "```xml" in response or "<jmeterTestPlan" in response:
        print("\n✓ Response contains XML content!")
    else:
        print("\n⚠ Response does not contain expected XML format")
        
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
