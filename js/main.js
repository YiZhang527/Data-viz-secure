/**
 * main.js
 * Main application file that initializes and coordinates all modules
 */

// Make DataStore accessible to other modules
window.DataStore = DataStore;

/**
 * Initialize the application when DOM is fully loaded
 */
function initializeApp() {
    
    // Initialize each module
    FileHandler.initialize();
    AnnotatedExport.initialize();
    UIController.initialize();
    
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
