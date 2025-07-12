/**
 * main.js
 * Main application file that initializes and coordinates all modules
 */

// Global DataStore for sharing data between modules
const DataStore = {
    originalData: null,  // Original data from the file (remains unchanged)
    currentData: null,   // Current data after all applied operations
    operations: [],      // List of applied operations
    currentFile: null    // Current file object
};

// Make DataStore accessible to other modules
window.DataStore = DataStore;

/**
 * Initialize the application when DOM is fully loaded
 */
function initializeApp() {
    console.log("Initializing Secure Data Visualization Platform...");
    
    // Initialize each module
    FileHandler.initialize();
    DataCleaner.initialize();
    ExportManager.initialize();
    AnnotatedExport.initialize();
    UIController.initialize();
    
    // Hide data cleaning options initially
    document.getElementById('data-cleaning').style.display = 'none';
    
    console.log("Application initialized successfully");
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);