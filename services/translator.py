import logging
import google.generativeai as genai
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Gemini AI for translation
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Common language codes
LANGUAGE_CODES = {
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Japanese': 'ja',
    'Chinese': 'zh',
    'Korean': 'ko',
    'Arabic': 'ar',
    'Hindi': 'hi',
    'Turkish': 'tr',
    'Dutch': 'nl',
    'Swedish': 'sv',
    'Polish': 'pl',
    'Vietnamese': 'vi',
    'Thai': 'th',
}

def detect_language(text):
    """
    Detect the language of the provided text using Gemini
    """
    try:
        model = genai.GenerativeModel(model_name="models/gemini-1.5-pro")
        
        prompt = f"""
        Analyze the following text and determine what language it is. 
        Only respond with the ISO 639-1 two-letter language code (e.g., 'en' for English, 'es' for Spanish, etc.).
        If you can't determine the language or it's not a natural language, respond with 'en'.
        
        Text: {text}
        """
        
        response = model.generate_content(prompt)
        language_code = response.text.strip().lower()
        
        # Validate the language code
        if len(language_code) != 2 or not language_code.isalpha():
            logger.warning(f"Invalid language code detected: {language_code}, defaulting to 'en'")
            return 'en'
        
        return language_code
    except Exception as e:
        logger.error(f"Error detecting language: {str(e)}")
        return 'en'  # Default to English

def translate_text(text, target_lang='en'):
    """
    Translate text to the target language
    """
    try:
        # If text is empty or already in target language, return as is
        if not text or len(text.strip()) == 0:
            return text
            
        model = genai.GenerativeModel(model_name="models/gemini-1.5-pro")
        
        prompt = f"""
        Translate the following text to {target_lang}. Only return the translation, nothing else.
        
        Text: {text}
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error translating text: {str(e)}")
        return text  # Return original text if translation fails

def translate_to_language(text, target_lang='en'):
    """
    Translate text to a specific language by code
    """
    try:
        if not text or len(text.strip()) == 0:
            return text
            
        model = genai.GenerativeModel(model_name="models/gemini-1.5-pro")
        
        prompt = f"""
        Translate the following text to {target_lang} language. Only return the translation, nothing else.
        
        Text: {text}
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error translating to specific language: {str(e)}")
        return text