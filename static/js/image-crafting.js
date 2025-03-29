/**
 * Image Crafting functionality for KARE Dashboard
 * 
 * This script handles image upload, processing, and displaying AI-generated suggestions.
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const uploadFeedback = document.getElementById('uploadFeedback');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const processImageBtn = document.getElementById('processImageBtn');
    const getSuggestionsBtn = document.getElementById('getSuggestionsBtn');
    const promptInput = document.getElementById('promptInput');
    const processingIndicator = document.getElementById('processingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    const analysisResults = document.getElementById('analysisResults');
    const variationsContainer = document.getElementById('variationsContainer');
    const variationsList = document.getElementById('variationsList');
    const emptyState = document.getElementById('emptyState');
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content');

    // Image analysis result elements
    const imageAnalysis = document.getElementById('imageAnalysis');
    const fulfillmentPlan = document.getElementById('fulfillmentPlan');
    const processingSteps = document.getElementById('processingSteps');
    const creativeSuggestions = document.getElementById('creativeSuggestions');
    
    // Variables to track state
    let uploadedFile = null;
    let imageUploaded = false;
    
    // Sidebar toggle functionality
    toggleSidebar.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('expanded');
    });
    
    // Check window width and collapse sidebar on small screens
    function checkWidth() {
        if (window.innerWidth < 768) {
            sidebar.classList.add('collapsed');
            content.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            content.classList.remove('expanded');
        }
    }
    
    // Initial check
    checkWidth();
    
    // Listen for window resize
    window.addEventListener('resize', checkWidth);

    // Upload area drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });

    uploadArea.addEventListener('dragleave', function() {
        this.classList.remove('active');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // File input change event
    imageUpload.addEventListener('change', function() {
        if (this.files.length) {
            handleFileUpload(this.files[0]);
        }
    });

    // Handle file upload
    function handleFileUpload(file) {
        // Check file type
        if (!file.type.match('image.*')) {
            showError('Please select an image file (JPEG, PNG, GIF)');
            return;
        }
        
        // Check file size (16MB max)
        if (file.size > 16 * 1024 * 1024) {
            showError('File size exceeds 16MB limit');
            return;
        }
        
        uploadedFile = file;
        
        // Show loading indicator in upload area
        uploadFeedback.innerHTML = `
            <div class="spinner-border text-primary mt-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Uploading image...</p>
        `;
        
        // Create FormData and upload the file
        const formData = new FormData();
        formData.append('file', file);
        
        fetch('/upload-image', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Display image preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    uploadArea.classList.add('d-none');
                    imagePreviewContainer.classList.remove('d-none');
                    processImageBtn.disabled = false;
                    getSuggestionsBtn.disabled = false;
                    imageUploaded = true;
                    
                    // Clear previous results
                    clearResults();
                };
                reader.readAsDataURL(file);
                
                // Clear any previous errors
                errorContainer.classList.add('d-none');
            } else {
                showError(data.error || 'Failed to upload image');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to upload image: ' + error.message);
        })
        .finally(() => {
            uploadFeedback.innerHTML = '';
        });
    }

    // Remove uploaded image
    removeImageBtn.addEventListener('click', function() {
        imagePreview.src = '';
        uploadArea.classList.remove('d-none');
        imagePreviewContainer.classList.add('d-none');
        processImageBtn.disabled = true;
        getSuggestionsBtn.disabled = true;
        imageUploaded = false;
        uploadedFile = null;
        clearResults();
    });

    // Process image with custom prompt
    processImageBtn.addEventListener('click', function() {
        if (!imageUploaded) {
            showError('Please upload an image first');
            return;
        }
        
        const prompt = promptInput.value.trim();
        
        // Show loading indicator
        showProcessingIndicator();
        
        // Process the image with the provided prompt
        fetch('/process-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Hide empty state and show results
                emptyState.classList.add('d-none');
                resultsContainer.classList.remove('d-none');
                
                // Show analysis results and hide variations
                analysisResults.classList.remove('d-none');
                variationsContainer.classList.add('d-none');
                
                // Populate analysis results
                const response = data.response;
                imageAnalysis.textContent = response.image_analysis;
                fulfillmentPlan.textContent = response.fulfillment_plan;
                
                // Clear and populate processing steps
                processingSteps.innerHTML = '';
                response.steps.forEach(step => {
                    const li = document.createElement('li');
                    li.textContent = step;
                    processingSteps.appendChild(li);
                });
                
                // Clear and populate creative suggestions
                creativeSuggestions.innerHTML = '';
                response.creative_suggestions.forEach(suggestion => {
                    const li = document.createElement('li');
                    li.textContent = suggestion;
                    creativeSuggestions.appendChild(li);
                });
            } else {
                showError(data.error || 'Failed to process image');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to process image: ' + error.message);
        })
        .finally(() => {
            hideProcessingIndicator();
        });
    });

    // Get automatic suggestions for the image
    getSuggestionsBtn.addEventListener('click', function() {
        if (!imageUploaded) {
            showError('Please upload an image first');
            return;
        }
        
        // Show loading indicator
        showProcessingIndicator();
        
        // Get automatic suggestions for the image (no prompt)
        fetch('/process-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Hide empty state and show results
                emptyState.classList.add('d-none');
                resultsContainer.classList.remove('d-none');
                
                // Show variations and hide analysis results
                analysisResults.classList.add('d-none');
                variationsContainer.classList.remove('d-none');
                
                // Clear and populate variations list
                variationsList.innerHTML = '';
                data.variations.forEach(variation => {
                    const variationItem = document.createElement('div');
                    variationItem.className = 'variation-item';
                    variationItem.innerHTML = `
                        <h5>${variation.title}</h5>
                        <p>${variation.description}</p>
                        <p class="text-muted"><strong>Why:</strong> ${variation.rationale}</p>
                        <button class="btn btn-sm btn-outline-primary try-variation-btn">Try This</button>
                    `;
                    variationsList.appendChild(variationItem);
                    
                    // Add event listener to the "Try This" button
                    const tryBtn = variationItem.querySelector('.try-variation-btn');
                    tryBtn.addEventListener('click', function() {
                        promptInput.value = variation.description;
                        // Auto-scroll to the prompt input
                        promptInput.scrollIntoView({ behavior: 'smooth' });
                        // Highlight the prompt input
                        promptInput.classList.add('highlight');
                        setTimeout(() => {
                            promptInput.classList.remove('highlight');
                        }, 1500);
                    });
                });
            } else {
                showError(data.error || 'Failed to get image suggestions');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Failed to get image suggestions: ' + error.message);
        })
        .finally(() => {
            hideProcessingIndicator();
        });
    });

    // Helper functions
    function showError(message) {
        errorContainer.classList.remove('d-none');
        errorMessage.textContent = message;
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorContainer.classList.add('d-none');
        }, 5000);
    }

    function clearResults() {
        // Reset results containers
        emptyState.classList.remove('d-none');
        resultsContainer.classList.add('d-none');
        errorContainer.classList.add('d-none');
        
        // Clear content
        imageAnalysis.textContent = '';
        fulfillmentPlan.textContent = '';
        processingSteps.innerHTML = '';
        creativeSuggestions.innerHTML = '';
        variationsList.innerHTML = '';
    }

    function showProcessingIndicator() {
        processingIndicator.classList.remove('d-none');
        emptyState.classList.add('d-none');
        resultsContainer.classList.add('d-none');
    }

    function hideProcessingIndicator() {
        processingIndicator.classList.add('d-none');
    }
});