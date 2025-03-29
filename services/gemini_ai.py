import os
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Gemini AI
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

def is_programming_related(query):
    """
    Determine if a query is related to programming
    """
    programming_keywords = [
        'python', 'java', 'javascript', 'js', 'code', 'coding', 'algorithm',
        'function', 'variable', 'class', 'object', 'html', 'css', 'programming',
        'developer', 'development', 'software', 'app', 'application', 'web dev',
        'frontend', 'backend', 'full stack', 'database', 'api', 'framework',
        'library', 'react', 'node', 'angular', 'vue', 'express', 'django',
        'flask', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'github',
        'git', 'version control', 'compiler', 'interpreter', 'debugging'
    ]
    
    query_lower = query.lower()
    for keyword in programming_keywords:
        if keyword in query_lower:
            return True
    
    return False

def get_python_info(topic):
    """
    Get information about Python
    """
    # Predefined responses for when API fails
    python_basics = """
# Python Basics

Python is a high-level, interpreted programming language known for its readability and simplicity.

## Key Features
- Easy to learn and use
- Interpreted language (no compilation needed)
- Dynamically typed
- Object-oriented
- Extensive standard library

## Basic Syntax Example
```python
# This is a comment
print("Hello, World!")  # Output: Hello, World!

# Variables
name = "Python"
version = 3.11
is_awesome = True

# Simple conditional
if is_awesome:
    print(f"{name} {version} is awesome!")
```
"""

    try:
        # Configure model parameters
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        model = genai.GenerativeModel(
            model_name="models/gemini-1.5-pro",
            generation_config=generation_config
        )
        
        prompt = f"""
        Provide comprehensive information about Python programming language
        focusing on {topic}. Include code examples where appropriate.
        Format your response with markdown for better readability.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error getting Python info: {str(e)}")
        return f"Here is some information about Python {topic}:\n\n{python_basics}"

def handle_programming_question(query):
    """
    Handle programming-related questions using Gemini AI
    """
    # Predefined response for when API fails
    default_response = """
# Programming Help

I'm currently experiencing some connectivity issues with the AI service.
Here are some general programming tips that might help:

## Best Practices
- Write readable, self-documenting code
- Break complex problems into smaller functions
- Test your code regularly
- Use version control (like Git)
- Comment your code to explain "why", not "what"

## Common Debugging Steps
1. Read error messages carefully
2. Use print statements or a debugger to track variable values
3. Check your logic with small test cases
4. Research similar problems online
5. Take a break and come back with fresh eyes
"""

    even_odd_response = """
# Python Program to Check if a Number is Even or Odd

```python
def check_even_odd(number):
    if number % 2 == 0:
        return f"{number} is even"
    else:
        return f"{number} is odd"

# Example usage
num = int(input("Enter a number: "))
result = check_even_odd(num)
print(result)
```
"""

    try:
        # Configure model parameters
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }
        
        model = genai.GenerativeModel(
            model_name="models/gemini-1.5-pro",
            generation_config=generation_config
        )
        
        prompt = f"""
        Answer the following programming question with clear explanations and examples.
        Use markdown formatting for better readability, including code blocks with appropriate
        syntax highlighting where relevant.
        
        Question: {query}
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error handling programming question: {str(e)}")
        
        # Check if this is about even/odd numbers
        if "even" in query.lower() and "odd" in query.lower():
            return even_odd_response
            
        return default_response