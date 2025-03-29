/**
 * Progress Tracker for Learning Roadmap
 * 
 * This file handles tracking progress on roadmap milestones.
 */

document.addEventListener('DOMContentLoaded', function() {
    setupMilestoneCheckboxes();
});

// Set up milestone checkboxes to track progress
function setupMilestoneCheckboxes() {
    const milestoneCheckboxes = document.querySelectorAll('.milestone-checkbox');
    
    milestoneCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const milestoneId = this.dataset.milestoneId;
            const isCompleted = this.checked;
            
            // Update the UI first for better perceived performance
            updateMilestoneUI(milestoneId, isCompleted);
            
            // Then save the progress to the server
            saveProgress(milestoneId, isCompleted);
        });
    });
    
    // Initialize progress chart if available
    const progressChartEl = document.getElementById('progressChart');
    if (progressChartEl) {
        const milestones = getMilestonesFromDOM();
        initProgressChart(milestones);
    }
}

// Update the milestone UI when checkbox is toggled
function updateMilestoneUI(milestoneId, isCompleted) {
    const milestoneEl = document.querySelector(`.timeline-item[data-milestone-id="${milestoneId}"]`);
    const marker = milestoneEl.querySelector('.timeline-marker');
    const milestoneTitle = milestoneEl.querySelector('.milestone-title');
    
    if (isCompleted) {
        marker.classList.add('completed');
        marker.querySelector('i').className = 'fas fa-check timeline-marker-icon';
        milestoneTitle.classList.add('text-decoration-line-through');
    } else {
        marker.classList.remove('completed');
        marker.querySelector('i').className = 'fas fa-circle timeline-marker-icon';
        milestoneTitle.classList.remove('text-decoration-line-through');
    }
    
    // Update the progress chart
    const milestones = getMilestonesFromDOM();
    updateProgressChart(milestones);
}

// Save progress to the server
function saveProgress(milestoneId, isCompleted) {
    fetch('/save_progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            milestone_id: milestoneId,
            completed: isCompleted
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save progress');
        }
        return response.json();
    })
    .then(data => {
        console.log('Progress saved successfully', data);
    })
    .catch(error => {
        console.error('Error saving progress:', error);
        // Revert UI changes if save fails
        const checkbox = document.querySelector(`.milestone-checkbox[data-milestone-id="${milestoneId}"]`);
        checkbox.checked = !isCompleted; // revert
        updateMilestoneUI(milestoneId, !isCompleted); // revert UI
        showToast('Failed to save progress. Please try again.', 'danger');
    });
}

// Helper function to get current milestones from the DOM
function getMilestonesFromDOM() {
    const milestoneElements = document.querySelectorAll('.timeline-item');
    const milestones = [];
    
    milestoneElements.forEach(el => {
        const id = el.dataset.milestoneId;
        const checkbox = document.querySelector(`.milestone-checkbox[data-milestone-id="${id}"]`);
        
        milestones.push({
            id: id,
            completed: checkbox.checked
        });
    });
    
    return milestones;
}