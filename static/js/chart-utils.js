/**
 * Chart utilities for the Learning Roadmap Generator
 * 
 * This file handles the creation and updating of progress visualizations.
 */

// Initialize the progress chart
function initProgressChart(milestones) {
    const ctx = document.getElementById('progressChart').getContext('2d');
    
    // Calculate completion percentage
    const completedCount = milestones.filter(m => m.completed).length;
    const totalCount = milestones.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    // Update the percentage display
    document.getElementById('progressPercentage').textContent = `${completionPercentage}%`;
    
    // Update the progress bar
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${completionPercentage}%`;
    progressBar.setAttribute('aria-valuenow', completionPercentage);
    document.getElementById('progressText').textContent = `${completionPercentage}% Complete`;
    
    // Create the doughnut chart
    window.progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [completedCount, totalCount - completedCount],
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--bs-success'),
                    getComputedStyle(document.documentElement).getPropertyValue('--bs-secondary')
                ],
                borderWidth: 0,
                borderRadius: 5,
            }]
        },
        options: {
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value} milestone${value !== 1 ? 's' : ''}`;
                        }
                    }
                }
            }
        }
    });
}

// Update the progress chart when milestones are completed/uncompleted
function updateProgressChart(milestones) {
    // Calculate new completion metrics
    const completedCount = milestones.filter(m => m.completed).length;
    const totalCount = milestones.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    // Update the percentage display with animation
    const percentageElement = document.getElementById('progressPercentage');
    percentageElement.textContent = `${completionPercentage}%`;
    percentageElement.classList.add('progress-updated');
    setTimeout(() => {
        percentageElement.classList.remove('progress-updated');
    }, 500);
    
    // Update the progress bar
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${completionPercentage}%`;
    progressBar.setAttribute('aria-valuenow', completionPercentage);
    document.getElementById('progressText').textContent = `${completionPercentage}% Complete`;
    
    // Update the chart data
    if (window.progressChart) {
        window.progressChart.data.datasets[0].data = [completedCount, totalCount - completedCount];
        window.progressChart.update();
    }
    
    // Add toast notification for milestone update
    showToast(`Progress updated: ${completionPercentage}% complete`);
}

// Create and show a toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    // Toast content
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toastElement);
    
    // Initialize and show the toast
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    toast.show();
    
    // Remove the toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}