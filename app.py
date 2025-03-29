import os
import logging
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Import AI services
from gemini_service import generate_learning_roadmap
from services.translator import translate_text, detect_language, translate_to_language
from services.sentiment import analyze_sentiment
from services.knowledge_base import search_knowledge_base
from services.gemini_ai import get_python_info, handle_programming_question, is_programming_related

# Determine which AI service to use (Gemini is default)
AI_SERVICE = os.environ.get("AI_SERVICE", "gemini").lower()

@app.route('/')
def index():
    """Render the main dashboard page"""
    return render_template('dashboard.html')

@app.route('/roadmap-generator')
def roadmap_generator():
    """Render the roadmap generator form page"""
    return render_template('index.html')

@app.route('/roadmap')
def view_roadmap():
    """Render the roadmap page"""
    roadmap = session.get('current_roadmap')
    if not roadmap:
        return render_template('index.html', error="No roadmap has been generated yet.")
    
    # Sync the roadmap with the saved progress
    progress = session.get('progress', {})
    for milestone in roadmap.get('milestones', []):
        milestone_id = milestone.get('id')
        if milestone_id in progress:
            milestone['completed'] = progress[milestone_id]
    
    return render_template('roadmap.html', roadmap=roadmap)

@app.route('/assistant-chatbot')
def assistant_chatbot():
    """Route for the AI Assistant Chatbot feature"""
    return render_template('chatbot.html')

@app.route('/study-tube')
def study_tube():
    """Route for the StudyTube feature"""
    # Initially load the page without videos 
    # (they will be loaded via JavaScript on the client side)
    return render_template('studytube.html', videos=[])

@app.route('/study-tube/search')
def study_tube_search():
    """Search for videos on YouTube based on query"""
    try:
        query = request.args.get('query', 'Python programming')
        
        # Import the scraper here to avoid circular imports
        from services.scraper import search_youtube_videos
        
        # Get YouTube search results
        results = search_youtube_videos(query)
        
        # Make sure we have videos, even if using fallback data
        if not results.get('videos'):
            logger.warning("No videos found, using fallback data")
            # Programming language fallbacks based on query
            default_videos = []
            
            if "python" in query.lower():
                default_videos = [
                    "https://www.youtube.com/embed/rfscVS0vtbw",  # Python full course
                    "https://www.youtube.com/embed/_uQrJ0TkZlc",  # Python tutorial
                    "https://www.youtube.com/embed/kqtD5dpn9C8"   # Python for beginners
                ]
            elif "java" in query.lower():
                default_videos = [
                    "https://www.youtube.com/embed/eIrMbAQSU34",  # Java tutorial
                    "https://www.youtube.com/embed/grEKMHGYyns",  # Java masterclass
                    "https://www.youtube.com/embed/xk4_1vDrzzo"   # Java for beginners
                ]
            elif "javascript" in query.lower():
                default_videos = [
                    "https://www.youtube.com/embed/W6NZfCO5SIk",  # JavaScript tutorial
                    "https://www.youtube.com/embed/PkZNo7MFNFg",  # JavaScript for beginners
                    "https://www.youtube.com/embed/hdI2bqOjy3c"   # JavaScript crash course
                ]
            else:
                default_videos = [
                    "https://www.youtube.com/embed/rfscVS0vtbw",  # Python course
                    "https://www.youtube.com/embed/W6NZfCO5SIk",  # JavaScript tutorial
                    "https://www.youtube.com/embed/eIrMbAQSU34"   # Java tutorial
                ]
                
            results['videos'] = default_videos
        
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error in StudyTube search: {str(e)}")
        # Always return some videos even on error
        default_videos = [
            "https://www.youtube.com/embed/rfscVS0vtbw",  # Python course
            "https://www.youtube.com/embed/W6NZfCO5SIk",  # JavaScript tutorial
            "https://www.youtube.com/embed/eIrMbAQSU34"   # Java tutorial
        ]
        return jsonify({
            'error': 'Unable to fetch videos. Showing some recommended programming tutorials.',
            'videos': default_videos
        })

@app.route('/generate_roadmap', methods=['POST'])
def create_roadmap():
    """Generate a personalized learning roadmap based on user inputs"""
    try:
        data = request.json
        experience_level = data.get('experience_level')
        selected_topics = data.get('selected_topics', [])
        timeframe = data.get('timeframe')
        
        # Input validation
        if not experience_level or not selected_topics or not timeframe:
            return jsonify({'error': 'Missing required fields'}), 400
        
        if len(selected_topics) > 3:
            return jsonify({'error': 'Maximum 3 topics allowed'}), 400
            
        # Generate roadmap using Gemini
        roadmap = generate_learning_roadmap(experience_level, selected_topics, timeframe)
        
        # Store the roadmap in session for persistence
        session['current_roadmap'] = roadmap
        
        # Initialize progress tracking in session if it doesn't exist
        if 'progress' not in session:
            session['progress'] = {}
            
        # Sync progress with any existing saved progress
        for milestone in roadmap.get('milestones', []):
            milestone_id = milestone.get('id')
            if milestone_id in session['progress']:
                milestone['completed'] = session['progress'][milestone_id]
            else:
                session['progress'][milestone_id] = milestone['completed']
        
        return jsonify(roadmap)
    
    except Exception as e:
        logging.error(f"Error generating roadmap: {str(e)}")
        return jsonify({'error': 'Failed to generate roadmap: ' + str(e)}), 500

@app.route('/save_progress', methods=['POST'])
def save_progress():
    """Save user's progress on their roadmap"""
    try:
        data = request.json
        milestone_id = data.get('milestone_id')
        completed = data.get('completed', False)
        
        # Validate input
        if not milestone_id:
            return jsonify({'error': 'Missing milestone ID'}), 400
        
        # Initialize progress tracking in session if it doesn't exist
        if 'progress' not in session:
            session['progress'] = {}
        
        # Save progress to session
        session['progress'][milestone_id] = completed
        
        # Update the roadmap in session too
        roadmap = session.get('current_roadmap')
        if roadmap:
            for milestone in roadmap.get('milestones', []):
                if milestone.get('id') == milestone_id:
                    milestone['completed'] = completed
                    break
            
            session['current_roadmap'] = roadmap
        
        return jsonify({'success': True})
    
    except Exception as e:
        logging.error(f"Error saving progress: {str(e)}")
        return jsonify({'error': 'Failed to save progress: ' + str(e)}), 500

# AI Assistant Chatbot API routes
@app.route('/api/translate', methods=['POST'])
def translate():
    """Translate text to English and back to original language"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Detect language and translate
        detected_lang = detect_language(text)
        translation_to_en = translate_text(text, 'en')
        translation_to_orig = translate_text(text, detected_lang)
        
        return jsonify({
            'eng': translation_to_en,
            'orilan': translation_to_orig,
            'lang': detected_lang
        })
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

@app.route('/api/translate_to_language', methods=['POST'])
def translate_specific():
    """Translate text to a specific language"""
    try:
        data = request.json
        text = data.get('text', '')
        target_lang = data.get('target_lang', 'en')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        translation = translate_to_language(text, target_lang)
        
        return jsonify({
            'data': translation
        })
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return jsonify({'error': f'Translation failed: {str(e)}'}), 500

@app.route('/api/sentiment', methods=['POST'])
def sentiment():
    """Analyze sentiment of provided text"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        sentiment_result = analyze_sentiment(text)
        
        return jsonify(sentiment_result)
    except Exception as e:
        logger.error(f"Sentiment analysis error: {str(e)}")
        return jsonify({'error': f'Sentiment analysis failed: {str(e)}'}), 500

@app.route('/api/knowledge', methods=['POST'])
def knowledge():
    """Search the knowledge base for information"""
    try:
        data = request.json
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        # Check if the query is a programming-related question
        if is_programming_related(query):
            # Extract Python-specific queries
            query_lower = query.lower()
            if "python" in query_lower:
                # For Python-specific topics, use the specialized function
                python_topic = query_lower.replace("python", "").strip()
                if not python_topic:
                    python_topic = "basics and overview"
                
                python_info = get_python_info(python_topic)
                return jsonify({
                    "results": [{
                        "faq": {
                            "question": query,
                            "answer": python_info
                        }
                    }]
                })
            else:
                # For other programming-related questions
                programming_response = handle_programming_question(query)
                return jsonify({
                    "results": [{
                        "faq": {
                            "question": query,
                            "answer": programming_response
                        }
                    }]
                })
        
        # If not programming-related, use the knowledge base
        knowledge_result = search_knowledge_base(query)
        
        # If knowledge base fails or returns no results, fall back to Gemini
        if "error" in knowledge_result or not knowledge_result.get("results"):
            logger.info(f"Knowledge base returned no results for '{query}', falling back to Gemini AI")
            ai_response = handle_programming_question(query)
            return jsonify({
                "results": [{
                    "faq": {
                        "question": query,
                        "answer": ai_response
                    }
                }]
            })
        
        return jsonify(knowledge_result)
    except Exception as e:
        logger.error(f"Knowledge/AI request error: {str(e)}")
        # Fall back to Gemini AI if there's an exception
        try:
            ai_response = handle_programming_question(request.get_json().get('query', ''))
            return jsonify({
                "results": [{
                    "faq": {
                        "question": request.get_json().get('query', ''),
                        "answer": ai_response
                    }
                }]
            })
        except Exception as inner_e:
            logger.error(f"AI fallback error: {str(inner_e)}")
            return jsonify({'error': f'Request failed: {str(e)}'}), 500

@app.route('/api/gemini', methods=['POST'])
def gemini_query():
    """Direct query to Gemini AI"""
    try:
        data = request.json
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
            
        response = handle_programming_question(query)
        
        return jsonify({
            'response': response
        })
    except Exception as e:
        logger.error(f"Gemini AI error: {str(e)}")
        return jsonify({'error': f'Gemini AI request failed: {str(e)}'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

    #hi