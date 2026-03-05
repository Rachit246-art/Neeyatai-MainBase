import os
import google.api_core.exceptions
from google import genai
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please check your .env file.")

client = genai.Client(api_key=GEMINI_API_KEY)

def generate_with_gemini(prompt):
    try:
        # Optimized configuration for FAST response (target: under 20 seconds)
        generation_config = {
            "temperature": 0.3,  # Lower temperature for faster, more focused responses
            "top_p": 0.7,
            "top_k": 10,  # Reduced for faster token selection
            "max_output_tokens": 3072,  # Sufficient for complete JMX generation
        }
       
        response = client.models.generate_content(
            model="gemini-2.5-flash",  # Updated to use gemini-2.5-flash (has quota available)
            contents=prompt,
            config=generation_config
        )
        return response.text.strip() if hasattr(response, "text") else ""
    except google.api_core.exceptions.DeadlineExceeded:
        raise RuntimeError("Request timed out. Please try again with a simpler prompt.")
    except google.api_core.exceptions.ResourceExhausted:
        raise RuntimeError("API quota exceeded. Please try again later or contact support.")
    except google.api_core.exceptions.GoogleAPIError as api_error:
        # Sanitize error message to prevent API key leakage
        error_msg = str(api_error)
        # Remove any potential API keys from error message
        import re
        sanitized_msg = re.sub(r'AIza[A-Za-z0-9_-]{35}', '[API_KEY_REDACTED]', error_msg)
        
        # Check for quota errors
        if '429' in error_msg or 'quota' in error_msg.lower() or 'RESOURCE_EXHAUSTED' in error_msg:
            raise RuntimeError("API quota exceeded. Please try again later or contact support.")
        
        raise RuntimeError(f"AI service error: {sanitized_msg}")
    except Exception as e:
        # Generic error without exposing internal details
        raise RuntimeError("An unexpected error occurred while generating the test plan.")


