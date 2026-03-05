import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Try different models
models_to_try = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
]

for model_name in models_to_try:
    print(f"\nTrying {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello")
        print(f"✓ {model_name} WORKS! Response: {response.text[:100]}")
        break
    except Exception as e:
        error_str = str(e)
        if '429' in error_str or 'quota' in error_str.lower():
            print(f"✗ {model_name}: Quota exceeded")
        elif '404' in error_str:
            print(f"✗ {model_name}: Model not found")
        else:
            print(f"✗ {model_name}: {error_str[:100]}")
