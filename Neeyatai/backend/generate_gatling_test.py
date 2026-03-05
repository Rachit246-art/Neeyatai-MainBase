import io
import re
from datetime import datetime, timezone
from users.utils import upload_fileobj_to_s3
from gemini import generate_with_gemini
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(funcName)s: %(message)s')
console_handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(console_handler)

logger.propagate = False


def is_valid_gatling_prompt(prompt: str) -> tuple[bool, str]:
    """
    Validates the user's prompt for Gatling test generation.
    Returns: (is_valid: bool, error_message: str|None)
    """
    if not prompt or len(prompt.strip()) < 10:
        logger.debug("❌ Prompt too short or empty")
        return False, "Prompt is too short. Please provide more details."

    prompt_clean = prompt.lower().strip()
    
    # Check for action keywords (more lenient)
    action_keywords = {
        "test", "generate", "run", "simulate", "load", "perform",
        "execute", "create", "build", "with", "for", "using"
    }
    
    # Check for context keywords
    context_keywords = {
        "http", "https", "request", "get", "post", "put", "delete", 
        "endpoint", "url", "users", "user", "clients", "scenario", "api"
    }
    
    has_action = any(word in prompt_clean for word in action_keywords)
    has_context = any(kw in prompt_clean for kw in context_keywords)
    
    # If it has URL and users, it's probably valid even without explicit action word
    has_url = "http://" in prompt_clean or "https://" in prompt_clean
    has_users = "user" in prompt_clean or "client" in prompt_clean
    
    if has_url and has_users:
        return True, None
    
    if not has_action:
        return False, "Prompt must include an action (e.g., test, run, simulate, generate) or specify URL with users."
    if not has_context:
        return False, "Prompt must include load testing context (e.g., URL, number of users)."
    
    return True, None


def extract_scala_from_markdown(text: str) -> str:
    """Extract Scala code from markdown code blocks"""
    if not text:
        return ""
    
    # Try to find ```scala block
    start = text.find("```scala")
    if start != -1:
        end = text.find("```", start + 8)
        if end != -1:
            return text[start + 8:end].strip()
    
    # Try to find generic ``` block
    start = text.find("```")
    if start != -1:
        end = text.find("```", start + 3)
        if end != -1:
            code = text[start + 3:end].strip()
            # Check if it looks like Scala code
            if "package" in code or "import io.gatling" in code or "class" in code:
                return code
    
    # Fallback: return if it looks like Scala
    stripped = text.strip()
    if "package" in stripped or "import io.gatling" in stripped:
        return stripped
    
    return ""


def build_gatling_prompt(prompt: str, uploaded_scala: str = "") -> str:
    """Build optimized prompt for Gatling test generation"""
    
    if uploaded_scala:
        # User uploaded a Scala file - focus on modification
        base = (
            "Modify or fix the provided Gatling Scala test script.\n"
            "Output ONLY Scala code inside ```scala ... ``` block. No explanations.\n"
            "\n"
            "Required structure:\n"
            "- Package declaration\n"
            "- Import statements (io.gatling.core.Predef._, io.gatling.http.Predef._)\n"
            "- Simulation class extending Simulation\n"
            "- HTTP protocol configuration with baseUrl\n"
            "- Scenario with HTTP requests\n"
            "- setUp with injection profile\n"
            "\n"
            f"Existing Scala script:\n```scala\n{uploaded_scala}\n```\n"
            "\n"
        )
        
        if prompt:
            base += f"User request: {prompt}\n"
        else:
            base += "User request: Fix and validate this Gatling script\n"
    else:
        # No file uploaded - generate from scratch
        base = (
            "Generate a valid Gatling Scala test script.\n"
            "Output ONLY Scala code inside ```scala ... ``` block. No explanations.\n"
            "\n"
            "Required structure:\n"
            "- Package declaration\n"
            "- Import statements (io.gatling.core.Predef._, io.gatling.http.Predef._)\n"
            "- Simulation class extending Simulation\n"
            "- HTTP protocol configuration with baseUrl\n"
            "- Scenario with HTTP requests\n"
            "- setUp with injection profile (atOnceUsers, rampUsers, etc.)\n"
            "\n"
            "Example structure:\n"
            "```scala\n"
            "package simulations\n"
            "\n"
            "import io.gatling.core.Predef._\n"
            "import io.gatling.http.Predef._\n"
            "import scala.concurrent.duration._\n"
            "\n"
            "class MySimulation extends Simulation {\n"
            "  val httpProtocol = http.baseUrl(\"https://example.com\")\n"
            "  \n"
            "  val scn = scenario(\"My Scenario\")\n"
            "    .exec(http(\"request_1\").get(\"/endpoint\"))\n"
            "  \n"
            "  setUp(scn.inject(atOnceUsers(10))).protocols(httpProtocol)\n"
            "}\n"
            "```\n"
            "\n"
            f"User request: {prompt}\n"
        )
    
    return base.strip()


def is_valid_gatling_script(scala_content: str) -> tuple[bool, str]:
    """
    Validates Gatling Scala script structure.
    Returns: (is_valid: bool, error_message: str|None)
    """
    try:
        # Check for required imports
        if "import io.gatling" not in scala_content:
            return False, "Missing Gatling imports"
        
        # Check for Simulation class
        if "extends Simulation" not in scala_content:
            return False, "Missing Simulation class"
        
        # Check for HTTP protocol
        if "httpProtocol" not in scala_content and "http.baseUrl" not in scala_content:
            return False, "Missing HTTP protocol configuration"
        
        # Check for scenario
        if "scenario(" not in scala_content:
            return False, "Missing scenario definition"
        
        # Check for setUp
        if "setUp(" not in scala_content:
            return False, "Missing setUp configuration"
        
        return True, "Validation passed"
        
    except Exception as e:
        return False, f"Validation error: {str(e)}"


def generate_and_upload_gatling_script(prompt: str, email: str, uploaded_scala: str = "", original_filename: str = None, max_attempts: int = 3) -> tuple[dict, int]:
    """
    Generate Gatling Scala test script using Gemini and upload to storage.
    Supports both new generation and modification of uploaded files.
    """
    try:
        # Validate: need either prompt or uploaded file
        if not prompt and not uploaded_scala:
            return {"status": "error", "message": "Prompt or Scala file is required"}, 400
        
        # If only file uploaded without prompt, validate it
        if uploaded_scala and not prompt:
            is_valid, validation_msg = is_valid_gatling_script(uploaded_scala)
            if is_valid:
                # File is already valid, just save it
                timestamp = datetime.now(timezone.utc).strftime("%d-%m-%Y_%H-%M-%S")
                if original_filename:
                    base = original_filename.rsplit(".", 1)[0]
                    scala_filename = f"{base}_{timestamp}.scala"
                else:
                    scala_filename = f"gatling_test_{timestamp}.scala"
                
                s3_key = f"uploads/{email}/{scala_filename}"
                upload_success = upload_fileobj_to_s3(
                    io.BytesIO(uploaded_scala.encode("utf-8")),
                    s3_key
                )
                
                if not upload_success:
                    return {"status": "error", "message": "Failed to save Gatling script"}, 500
                
                return {
                    "status": "success",
                    "message": "Gatling script validated and saved successfully!",
                    "scala_filename": scala_filename
                }, 200
        
        # Validate prompt if provided
        if prompt:
            is_valid, error_msg = is_valid_gatling_prompt(prompt)
            if not is_valid and not uploaded_scala:
                return {"status": "error", "message": error_msg}, 400
        
        # Build prompt
        full_prompt = build_gatling_prompt(prompt, uploaded_scala)
        
        # Generate with retries
        for attempt in range(1, max_attempts + 1):
            logger.info(f"🔄 Attempt {attempt}/{max_attempts} to generate Gatling script")
            
            try:
                # Call Gemini API
                raw_response = generate_with_gemini(full_prompt)
                
                # Extract Scala code
                scala_code = extract_scala_from_markdown(raw_response)
                
                if not scala_code:
                    logger.warning(f"⚠️ Attempt {attempt}: No Scala code extracted")
                    if attempt < max_attempts:
                        full_prompt += "\n\nPlease provide ONLY the Scala code inside ```scala ... ``` block."
                        continue
                    return {"status": "error", "message": "Failed to extract Scala code from response"}, 500
                
                # Validate Scala script
                is_valid, validation_msg = is_valid_gatling_script(scala_code)
                
                if is_valid:
                    # Generate filename
                    timestamp = datetime.now(timezone.utc).strftime("%d-%m-%Y_%H-%M-%S")
                    if original_filename:
                        base = original_filename.rsplit(".", 1)[0]
                        scala_filename = f"{base}_{timestamp}.scala"
                    else:
                        scala_filename = f"gatling_test_{timestamp}.scala"
                    
                    s3_key = f"uploads/{email}/{scala_filename}"
                    
                    # Upload to storage
                    upload_success = upload_fileobj_to_s3(
                        io.BytesIO(scala_code.encode("utf-8")),
                        s3_key
                    )
                    
                    if not upload_success:
                        return {"status": "error", "message": "Failed to save Gatling script"}, 500
                    
                    logger.info(f"✅ Gatling script generated and saved: {scala_filename}")
                    return {
                        "status": "success",
                        "message": "Gatling test script generated successfully!",
                        "scala_filename": scala_filename
                    }, 200
                
                else:
                    logger.warning(f"⚠️ Attempt {attempt}: Validation failed - {validation_msg}")
                    if attempt < max_attempts:
                        full_prompt += f"\n\nPrevious attempt failed validation: {validation_msg}. Please fix and regenerate."
                        continue
                    return {"status": "error", "message": f"Generated script validation failed: {validation_msg}"}, 500
                    
            except Exception as e:
                logger.error(f"❌ Attempt {attempt} failed: {str(e)}")
                if attempt < max_attempts:
                    continue
                raise
        
        return {"status": "error", "message": "Failed to generate valid Gatling script after multiple attempts"}, 500
        
    except Exception as e:
        logger.exception("❌ Gatling generation error:")
        return {"status": "error", "message": f"Internal error: {str(e)}"}, 500
