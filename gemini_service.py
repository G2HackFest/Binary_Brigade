import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Gemini AI client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# List available models for debugging
try:
    available_models = [m.name for m in genai.list_models()]
    logging.info(f"Available Gemini models: {available_models}")
except Exception as e:
    logging.error(f"Error listing models: {str(e)}")

def generate_learning_roadmap(experience_level, selected_topics, timeframe):
    """
    Generate a personalized learning roadmap using Google's Gemini API
    
    Args:
        experience_level (str): User's experience level (Beginner/Intermediate/Advanced)
        selected_topics (list): List of topics the user wants to learn
        timeframe (str): Desired learning timeframe (e.g., "1 Month", "3 Months")
        
    Returns:
        dict: A structured roadmap with milestones and resources
    """
    try:
        # Format the topics for inclusion in the prompt
        topics_str = ", ".join(selected_topics)
        
        # Construct the prompt for Gemini
        prompt = f"""
        Create a personalized learning roadmap for a {experience_level.lower()} level student who wants to learn {topics_str} within {timeframe}.
        
        The roadmap should include:
        1. A title for the roadmap
        2. An introduction paragraph describing the learning path
        3. 5-8 detailed milestones (more for longer timeframes, fewer for shorter ones)
        4. Each milestone should have:
           - A title
           - A detailed description of what to learn and why it's important
           - Estimated time to complete
           - 2-4 specific learning resources (courses, tutorials, documentation, books, etc.) with URLs
        5. A conclusion with next steps after completing the roadmap
        
        Return the response in the following JSON format:
        {{
            "title": "Roadmap title",
            "description": "Introduction paragraph",
            "experience_level": "{experience_level}",
            "topics": {json.dumps(selected_topics)},
            "timeframe": "{timeframe}",
            "milestones": [
                {{
                    "id": "milestone-1",
                    "title": "Milestone title",
                    "description": "Detailed description",
                    "estimated_time": "Time estimate",
                    "resources": [
                        {{
                            "title": "Resource title",
                            "url": "resource URL",
                            "type": "article/video/course/etc",
                            "description": "Brief description of the resource"
                        }}
                    ]
                }}
            ],
            "conclusion": "Conclusion paragraph with next steps"
        }}
        
        Make sure all resources are real, relevant, and currently available. Include a mix of free and paid resources.
        Remember to strictly follow the JSON format above, with no additional text or formatting.
        """
        
        # Configure Gemini model parameters
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        # Try to use the available Gemini models
        model_names = ["models/gemini-1.5-pro", "models/gemini-1.5-pro-latest", "models/gemini-1.5-flash", "models/gemini-pro"]
        
        success = False
        error_messages = []
        response = None
        
        for model_name in model_names:
            try:
                logging.info(f"Attempting to use model: {model_name}")
                model = genai.GenerativeModel(
                    model_name=model_name,
                    generation_config=generation_config
                )
                
                # Get the response
                response = model.generate_content(prompt)
                success = True
                logging.info(f"Successfully used model: {model_name}")
                break
            except Exception as e:
                error_message = str(e)
                error_messages.append(f"Error with model {model_name}: {error_message}")
                logging.error(f"Failed with model {model_name}: {error_message}")
        
        if not success or response is None:
            error_details = "; ".join(error_messages)
            raise Exception(f"All available models failed: {error_details}")
        
        # Parse the JSON response
        # The response might have formatting characters or ```json blocks
        response_text = response.text
        
        # Try to extract JSON content if enclosed in code blocks
        if "```json" in response_text:
            json_content = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            json_content = response_text.split("```")[1].strip()
        else:
            json_content = response_text
            
        # Parse the JSON content
        roadmap_data = json.loads(json_content)
        
        # Add progress data to each milestone
        for milestone in roadmap_data.get('milestones', []):
            milestone['completed'] = False
            
        return roadmap_data
        
    except Exception as e:
        logging.error(f"Error in roadmap generation: {str(e)}")
        raise Exception(f"Failed to generate roadmap: {str(e)}")