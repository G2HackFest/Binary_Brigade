import logging
import google.generativeai as genai
import os
import json

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Gemini AI for sentiment analysis
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

def analyze_sentiment(text):
    """
    Analyze the sentiment of the provided text using Gemini
    """
    try:
        model = genai.GenerativeModel(model_name="models/gemini-1.5-pro")
        
        prompt = f"""
        Analyze the sentiment of the following text. Classify it as 'positive', 'negative', or 'neutral'.
        Also provide a confidence score between 0 and 1, and a brief explanation of why this sentiment was detected.
        Return only a JSON object with the keys 'sentiment', 'confidence', and 'explanation'.
        
        Text: {text}
        """
        
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Extract JSON from the response
        if '```json' in response_text:
            json_content = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            json_content = response_text.split('```')[1].strip()
        else:
            json_content = response_text.strip()
            
        # Parse JSON
        result = json.loads(json_content)
        
        # Ensure the response has the expected format
        if 'sentiment' not in result or 'confidence' not in result or 'explanation' not in result:
            raise ValueError("Response missing required fields")
            
        return result
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        # Return default response if analysis fails
        return {
            'sentiment': 'neutral',
            'confidence': 0.5,
            'explanation': 'Unable to analyze sentiment due to technical issues.'
        }