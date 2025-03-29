import os
import logging
import base64
import json
from io import BytesIO
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Gemini AI client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Check available models for vision capabilities
try:
    available_models = [m.name for m in genai.list_models() if "vision" in m.supported_generation_methods]
    logging.info(f"Available Gemini vision models: {available_models}")
    
    # Preferred models in order of priority
    PREFERRED_MODELS = [
        "models/gemini-1.5-pro-vision",
        "models/gemini-1.5-flash-vision",
        "models/gemini-pro-vision"
    ]
    
    # Find the first available preferred model
    VISION_MODEL = next((model for model in PREFERRED_MODELS if model in available_models), None)
    
    if not VISION_MODEL:
        logging.warning("No preferred vision models available. Using first available vision model instead.")
        VISION_MODEL = available_models[0] if available_models else None
    
    logging.info(f"Selected vision model: {VISION_MODEL}")
    
except Exception as e:
    logging.error(f"Error listing models: {str(e)}")
    VISION_MODEL = "models/gemini-pro-vision"  # Fallback to standard vision model

def encode_image_to_base64(image_path):
    """
    Encode an image file to base64 for API sending
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def process_image(image_path, prompt):
    """
    Process an image with Gemini using the provided prompt
    """
    try:
        # Load and prepare the image
        img = Image.open(image_path)
        
        # Initialize the model
        model = genai.GenerativeModel(VISION_MODEL)
        
        # Send the image and prompt to Gemini
        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": encode_image_to_base64(image_path)}
        ])
        
        # Parse and return the response
        return {
            "success": True,
            "result": response.text,
            "model_used": VISION_MODEL
        }
    
    except Exception as e:
        logging.error(f"Error processing image with Gemini: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def generate_image_variations(image_path):
    """
    Generate descriptions of variations for the provided image
    """
    prompt = """
    You are an expert image editor. Analyze this image and suggest 5 different creative
    variations or enhancements that could be made to it. For each variation, provide:
    
    1. A title for the variation
    2. A detailed description of what changes would be made
    3. Why this variation would be interesting or useful
    
    Format your response as a JSON with the following structure:
    {
        "variations": [
            {
                "title": "Variation title",
                "description": "Detailed description of changes",
                "rationale": "Why this would be interesting or useful"
            },
            ...
        ]
    }
    
    IMPORTANT: Respond ONLY with the JSON. No additional text before or after.
    """
    
    result = process_image(image_path, prompt)
    
    if result["success"]:
        try:
            # Try to parse the JSON from the response
            text_response = result["result"].strip()
            
            # Handle if the response is wrapped in markdown code blocks
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif "```" in text_response:
                text_response = text_response.split("```")[1].strip()
            
            # Parse the JSON content
            variations_data = json.loads(text_response)
            return {
                "success": True,
                "variations": variations_data["variations"]
            }
            
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON from response: {str(e)}")
            return {
                "success": False,
                "error": "Failed to parse JSON response from AI",
                "raw_response": result["result"]
            }
    
    return result

def process_image_prompt(image_path, user_prompt):
    """
    Process an image based on user's specific prompt/request
    """
    # Enhance the user prompt to get better results
    enhanced_prompt = f"""
    You are an expert image editor and creative director. I'm showing you an image with this request:
    
    "{user_prompt}"
    
    Please analyze the image and provide:
    
    1. A detailed description of what you see in the image
    2. How you would fulfill the user's request regarding this image
    3. 3-5 specific steps or techniques that would be used to create the desired result
    
    Format your response as a JSON with the following structure:
    {{
        "image_analysis": "Your description of the image",
        "fulfillment_plan": "How you would fulfill the user's request",
        "steps": [
            "Step 1: Description",
            "Step 2: Description",
            ...
        ],
        "creative_suggestions": [
            "Additional suggestion 1",
            "Additional suggestion 2"
        ]
    }}
    
    IMPORTANT: Respond ONLY with the JSON. No additional text before or after.
    """
    
    result = process_image(image_path, enhanced_prompt)
    
    if result["success"]:
        try:
            # Try to parse the JSON from the response
            text_response = result["result"].strip()
            
            # Handle if the response is wrapped in markdown code blocks
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            elif "```" in text_response:
                text_response = text_response.split("```")[1].strip()
            
            # Parse the JSON content
            response_data = json.loads(text_response)
            return {
                "success": True,
                "response": response_data
            }
            
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse JSON from response: {str(e)}")
            return {
                "success": False,
                "error": "Failed to parse JSON response from AI",
                "raw_response": result["result"]
            }
    
    return result