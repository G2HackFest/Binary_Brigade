// Initialize variables
let recognition;
let isListening = false;
let detectedLanguage = 'en';
let selectedRating = 0;

// DOM elements
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const voiceIndicator = document.querySelector('.voice-indicator');
const endChatBtn = document.querySelector('.end-chat-btn');
const agentBtn = document.querySelector('.agent-btn');
const feedbackBtn = document.querySelector('.feedback-btn');
const feedbackModal = document.getElementById('feedback-modal');
const closeModal = document.querySelector('.close-modal');
const feedbackForm = document.getElementById('feedback-form');
const ratingStars = document.querySelectorAll('.rating i');
const detectedLanguageSpan = document.getElementById('detected-language');

// Initialize the Web Speech API
function initSpeechRecognition() {
    try {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new window.SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            stopListening();
            sendMessage();
        };

        recognition.onstart = function() {
            isListening = true;
            voiceBtn.classList.add('active');
            voiceIndicator.classList.add('active');
        };

        recognition.onend = function() {
            stopListening();
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            stopListening();
            addBotMessage("Sorry, I couldn't hear you. Please try again or type your message.");
        };

        return true;
    } catch (e) {
        console.error('Web Speech API is not supported in this browser.', e);
        return false;
    }
}

// Stop listening for speech
function stopListening() {
    if (recognition) {
        recognition.stop();
    }
    isListening = false;
    voiceBtn.classList.remove('active');
    voiceIndicator.classList.remove('active');
}

// Start listening for speech
function startListening() {
    if (recognition) {
        recognition.start();
    } else {
        if (initSpeechRecognition()) {
            recognition.start();
        } else {
            addBotMessage("Sorry, voice recognition is not supported in your browser.");
        }
    }
}

// Toggle listening state
function toggleListening() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

// Format current time for message timestamp
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Add a user message to the chat
function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('p');
    messageText.textContent = text;
    
    const messageTime = document.createElement('p');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTime();
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(messageContent);
    
    chatWindow.appendChild(messageDiv);
    scrollToBottom();
}

// Add a bot message to the chat
function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('p');
    messageText.textContent = text;
    
    const messageTime = document.createElement('p');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTime();
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(messageContent);
    
    chatWindow.appendChild(messageDiv);
    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Add a bot message to the chat with markdown support
function addBotMessageWithMarkdown(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    // Process markdown using a regex approach for code blocks
    let formattedText = text;
    
    // Replace markdown code blocks with HTML, preserving language if specified
    formattedText = formattedText.replace(/```([\w-]*)\n([\s\S]+?)```/g, function(match, language, code) {
        const langClass = language ? ` class="language-${language}"` : '';
        return `<pre><code${langClass}>${code.trim()}</code></pre>`;
    });
    
    // Replace inline code with HTML
    formattedText = formattedText.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Replace bold text
    formattedText = formattedText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic text
    formattedText = formattedText.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Replace headers
    formattedText = formattedText.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    formattedText = formattedText.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    formattedText = formattedText.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Replace numbered lists
    let inOrderedList = false;
    let listHtml = '';
    const lines = formattedText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^\d+\.\s/)) {
            if (!inOrderedList) {
                inOrderedList = true;
                listHtml += '<ol>';
            }
            const listItem = lines[i].replace(/^\d+\.\s(.*)$/, '<li>$1</li>');
            listHtml += listItem;
            lines[i] = '';
        } else if (inOrderedList && lines[i].trim() !== '') {
            inOrderedList = false;
            listHtml += '</ol>';
            lines[i - 1] += listHtml;
            listHtml = '';
        }
    }
    
    if (inOrderedList) {
        listHtml += '</ol>';
        lines[lines.length - 1] += listHtml;
    }
    
    formattedText = lines.join('\n');
    
    // Replace bullet points
    formattedText = formattedText.replace(/^\* (.*$)/gm, '<li>$1</li>');
    formattedText = formattedText.replace(/^- (.*$)/gm, '<li>$1</li>');
    
    // Wrap unordered lists
    if (formattedText.includes('<li>')) {
        // Find all sequences of list items and wrap them in ul tags
        formattedText = formattedText.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
    }
    
    // Convert line breaks to paragraphs, but don't mess with HTML elements
    const paragraphs = [];
    const htmlParts = formattedText.split(/(<[^>]*>)/g);
    let isInsideHtml = false;
    let currentParagraph = '';
    
    for (let i = 0; i < htmlParts.length; i++) {
        const part = htmlParts[i];
        
        if (part.startsWith('<') && !part.startsWith('</')) {
            isInsideHtml = true;
            currentParagraph += part;
        } else if (part.startsWith('</')) {
            isInsideHtml = false;
            currentParagraph += part;
        } else if (isInsideHtml) {
            currentParagraph += part;
        } else {
            // Not inside HTML, process as text
            const lines = part.split('\n\n');
            for (let j = 0; j < lines.length; j++) {
                if (lines[j].trim() !== '') {
                    if (j > 0 || currentParagraph === '') {
                        if (currentParagraph !== '') {
                            paragraphs.push(currentParagraph);
                            currentParagraph = '';
                        }
                        currentParagraph += `<p>${lines[j]}</p>`;
                    } else {
                        currentParagraph += lines[j];
                    }
                }
            }
        }
    }
    
    if (currentParagraph !== '') {
        paragraphs.push(currentParagraph);
    }
    
    formattedText = paragraphs.join('');
    
    // Remove any empty paragraphs
    formattedText = formattedText.replace(/<p>\s*<\/p>/g, '');
    
    messageText.innerHTML = formattedText;
    
    const messageTime = document.createElement('p');
    messageTime.className = 'message-time';
    messageTime.textContent = getCurrentTime();
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(messageContent);
    
    chatWindow.appendChild(messageDiv);
    scrollToBottom();
    
    // Trigger code highlighting
    if (typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(messageText);
    }
}

// Send user message and process response
function sendMessage() {
    const message = chatInput.value.trim();
    
    if (message === '') {
        return;
    }
    
    // Add user message to chat
    addUserMessage(message);
    chatInput.value = '';
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message loading';
    loadingDiv.innerHTML = '<div class="message-content"><p>...</p></div>';
    chatWindow.appendChild(loadingDiv);
    scrollToBottom();
    
    // First, translate the message
    $.ajax({
        url: '/api/translate',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ text: message }),
        success: function(translationResponse) {
            // Remove loading indicator
            chatWindow.removeChild(loadingDiv);
            
            if (translationResponse.error) {
                addBotMessage("Sorry, I encountered an error processing your message.");
                return;
            }
            
            // Update detected language
            detectedLanguage = translationResponse.lang;
            updateDetectedLanguage(detectedLanguage);
            
            // Search knowledge base or Gemini AI with translated English text
            $.ajax({
                url: '/api/knowledge',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ query: translationResponse.eng }),
                success: function(knowledgeResponse) {
                    if (knowledgeResponse.error) {
                        addBotMessage("I'm sorry, I encountered an error retrieving information. Please try again later.");
                        return;
                    }
                    
                    if (!knowledgeResponse.results || knowledgeResponse.results.length === 0) {
                        // If no results from knowledge or AI, show a generic response
                        addBotMessage("I'm sorry, I don't have information on that topic.");
                        return;
                    }
                    
                    // Get the answer from knowledge base or Gemini AI
                    const answer = knowledgeResponse.results[0].faq.answer;
                    
                    // Check if this is likely a programming response (has code blocks or markdown)
                    const isProgrammingResponse = 
                        answer.includes('```') || 
                        answer.includes('`') || 
                        answer.includes('#') || 
                        answer.match(/\*\*(.*?)\*\*/g);
                    
                    if (isProgrammingResponse) {
                        // Display programming responses with markdown formatting 
                        addBotMessageWithMarkdown(answer);
                    } else {
                        // For non-programming responses, translate back to user's language
                        $.ajax({
                            url: '/api/translate_to_language',
                            type: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ 
                                text: answer,
                                target_lang: detectedLanguage 
                            }),
                            success: function(translatedResponse) {
                                addBotMessage(translatedResponse.data);
                            },
                            error: function() {
                                // If translation fails, show the English response
                                addBotMessage(answer);
                            }
                        });
                    }
                },
                error: function() {
                    // Show error message
                    addBotMessage("I'm sorry, but I couldn't process your request at the moment. Please try again later.");
                }
            });
        },
        error: function() {
            // Remove loading indicator
            chatWindow.removeChild(loadingDiv);
            
            // Show error message
            addBotMessage("I'm having trouble connecting to the server. Please check your internet connection and try again.");
        }
    });
}

// Update the detected language display
function updateDetectedLanguage(langCode) {
    // Map of language codes to language names
    const languageNames = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'tr': 'Turkish',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'pl': 'Polish',
        'vi': 'Vietnamese',
        'th': 'Thai'
    };
    
    const languageName = languageNames[langCode] || langCode;
    detectedLanguageSpan.textContent = languageName;
}

// Show the feedback modal
function showFeedbackModal() {
    feedbackModal.style.display = 'flex';
}

// Hide the feedback modal
function hideFeedbackModal() {
    feedbackModal.style.display = 'none';
}

// Set the star rating
function setRating(rating) {
    selectedRating = rating;
    
    // Update stars UI
    ratingStars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
}

// Submit feedback
function submitFeedback(event) {
    event.preventDefault();
    
    const feedbackText = document.getElementById('feedback-text').value;
    
    // Here you would typically send the feedback to your server
    console.log('Feedback:', {
        rating: selectedRating,
        comment: feedbackText
    });
    
    // Show confirmation message
    addBotMessage("Thank you for your feedback! We appreciate your input.");
    
    // Reset and hide the modal
    setRating(0);
    document.getElementById('feedback-text').value = '';
    hideFeedbackModal();
}

// Setup event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Voice button
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleListening);
    }
    
    // Chat input - submit on Enter, but allow Shift+Enter for new line
    if (chatInput) {
        chatInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }
    
    // End chat button
    if (endChatBtn) {
        endChatBtn.addEventListener('click', function() {
            // Clear chat history
            while (chatWindow.firstChild) {
                chatWindow.removeChild(chatWindow.firstChild);
            }
            
            // Add welcome message
            addBotMessage("Chat ended. How else can I help you today?");
        });
    }
    
    // Agent info button
    if (agentBtn) {
        agentBtn.addEventListener('click', function() {
            addBotMessage("I'm your AI assistant, powered by Google's Gemini model. I can help with questions, provide information, and assist with programming topics. I support multiple languages and aim to provide accurate and helpful responses. Note that I'm a language model, so I might not have information on very recent events.");
        });
    }
    
    // Feedback button
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', showFeedbackModal);
    }
    
    // Close modal button
    if (closeModal) {
        closeModal.addEventListener('click', hideFeedbackModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === feedbackModal) {
            hideFeedbackModal();
        }
    });
    
    // Feedback form submission
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', submitFeedback);
    }
    
    // Star rating
    if (ratingStars) {
        ratingStars.forEach((star, index) => {
            star.addEventListener('click', function() {
                setRating(index + 1);
            });
        });
    }
    
    // Initialize the welcome message
    addBotMessage("Hi! I'm your multilingual AI assistant. How can I help you today?");
});