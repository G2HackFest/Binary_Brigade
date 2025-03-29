/**
 * Form Validation for Learning Roadmap Generator
 * 
 * This file handles the form submission and validation for the roadmap generator form.
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('roadmapForm');
    const errorMessage = document.getElementById('errorMessage');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const topicCheckboxes = document.querySelectorAll('.topic-checkbox');
    
    // Limit the number of selected topics to 3
    let maxTopics = 3;
    
    topicCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedTopics = document.querySelectorAll('.topic-checkbox:checked');
            
            if (checkedTopics.length > maxTopics) {
                this.checked = false;
                errorMessage.textContent = `Please select a maximum of ${maxTopics} topics.`;
                errorMessage.classList.remove('d-none');
                setTimeout(() => {
                    errorMessage.classList.add('d-none');
                }, 3000);
            } else {
                errorMessage.classList.add('d-none');
            }
        });
    });
    
    // Form submission handler
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            const checkedTopics = document.querySelectorAll('.topic-checkbox:checked');
            if (checkedTopics.length === 0) {
                errorMessage.textContent = 'Please select at least one topic.';
                errorMessage.classList.remove('d-none');
                return;
            }
            
            if (checkedTopics.length > maxTopics) {
                errorMessage.textContent = `Please select a maximum of ${maxTopics} topics.`;
                errorMessage.classList.remove('d-none');
                return;
            }
            
            // Hide form and show loading indicator
            form.classList.add('d-none');
            loadingIndicator.classList.remove('d-none');
            
            // Get form data
            const experienceLevel = document.querySelector('input[name="experienceLevel"]:checked').value;
            const timeframe = document.querySelector('input[name="timeframe"]:checked').value;
            const selectedTopics = Array.from(checkedTopics).map(cb => cb.value);
            
            // Send AJAX request to generate roadmap
            fetch('/generate_roadmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    experience_level: experienceLevel,
                    selected_topics: selectedTopics,
                    timeframe: timeframe
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error generating roadmap');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Redirect to the roadmap page
                window.location.href = '/roadmap';
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Show error message
                loadingIndicator.classList.add('d-none');
                form.classList.remove('d-none');
                
                errorMessage.textContent = `Failed to generate roadmap: ${error.message}`;
                errorMessage.classList.remove('d-none');
            });
        });
    }
});