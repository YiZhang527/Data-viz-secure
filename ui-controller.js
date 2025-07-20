/**
 * ui-controller.js
 * Manages UI updates and interactions
 */

const UIController = {
    initialize: function() {
        console.log("Initializing UIController...");
        
        // Set up initial UI state
        this.setupInitialState();
        
        // Set up any UI-related event listeners
        this.setupEventListeners();
    },
    
    // Setup initial UI state
    setupInitialState: function() {
        // Make sure data cleaning area is visible
        const dataCleaning = document.getElementById('data-cleaning');
        if (dataCleaning) {
            dataCleaning.style.display = 'block';
        }
        
        // Initialize validation results placeholder if the element exists
        const validationResults = document.getElementById('validation-results');
        if (validationResults && validationResults.innerHTML === '') {
            validationResults.innerHTML = '<div class="placeholder-message">Upload a file to see validation results</div>';
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // You can add any additional UI-related event listeners here
    },
    
    // Update file information display
    updateFileInfo: function(file) {
        console.log("Updating file info...");
        
        // Find the new file info display area
        const newFileInfoDisplay = document.getElementById('new-file-info-display');
        
        if (newFileInfoDisplay) {
            newFileInfoDisplay.innerHTML = `
                <h3>Selected File:</h3>
                <p>File name: ${file.name}</p>
                <p>File size: ${(file.size / 1024).toFixed(2)} KB</p>
                <p>File type: ${file.type || 'Unknown'}</p>
                <p>Last modified: ${new Date(file.lastModified).toLocaleString()}</p>
            `;
        }
        
        // Keep updating the original file info display for compatibility
        // but it will be hidden by CSS
        const fileInfoDisplay = document.getElementById('file-info-display');
        if (fileInfoDisplay) {
            fileInfoDisplay.innerHTML = `
                <h3>Selected File:</h3>
                <p>File name: ${file.name}</p>
                <p>File size: ${(file.size / 1024).toFixed(2)} KB</p>
                <p>File type: ${file.type || 'Unknown'}</p>
                <p>Last modified: ${new Date(file.lastModified).toLocaleString()}</p>
            `;
        }
        
        // Make sure data cleaning area is visible when a file is loaded
        this.showDataCleaningArea();
    },
    
    // Show data cleaning area
    showDataCleaningArea: function() {
        const dataCleaning = document.getElementById('data-cleaning');
        if (dataCleaning) {
            dataCleaning.style.display = 'block';
        }
    },
    
    // Display cleaning results
    displayCleaningResults: function(results) {
        console.log("Displaying cleaning results...");
        const resultsDiv = document.getElementById('cleaning-results');
        
        if (resultsDiv) {
            resultsDiv.innerHTML = results.message;
            
            // Highlight the results with a success style
            resultsDiv.className = 'cleaning-results-success';
            
            // After a delay, remove the highlight
            setTimeout(() => {
                resultsDiv.className = '';
            }, 2000);
        }
    },
    
    // Display outlier detection results
    displayOutlierResults: function(columnResults, totalOutliers) {
        console.log("Displaying outlier results...");
        const resultsDiv = document.getElementById('cleaning-results');
        
        if (resultsDiv) {
            if (totalOutliers > 0) {
                let resultsHTML = `<p>Detected <strong>${totalOutliers}</strong> outliers across ${columnResults.length} columns using Z-score method (threshold: ±3).</p>`;
                
                resultsHTML += '<ul>';
                columnResults.forEach(col => {
                    resultsHTML += `<li><strong>${col.name}</strong>: ${col.outlierCount} outliers found (mean: ${col.mean.toFixed(2)}, std dev: ${col.stdDev.toFixed(2)})</li>`;
                });
                resultsHTML += '</ul>';
                
                resultsHTML += '<p>Outliers have been replaced with empty values in the cleaned data.</p>';
                
                resultsDiv.innerHTML = resultsHTML;
            } else {
                resultsDiv.innerHTML = '<p>No outliers were found using Z-score method (threshold: ±3).</p>';
            }
            
            // Add a visual indicator for the results
            resultsDiv.className = totalOutliers > 0 ? 'outlier-results-found' : 'outlier-results-none';
            
            // After a delay, remove the highlight
            setTimeout(() => {
                resultsDiv.className = '';
            }, 2000);
        }
    },
    
    // Update the download buttons visibility
    updateDownloadButtonsVisibility: function(show) {
        const downloadCleanedBtn = document.getElementById('download-cleaned-data');
        const downloadAnnotatedBtn = document.getElementById('download-annotated-data');
        
        if (downloadCleanedBtn) {
            downloadCleanedBtn.style.display = show ? 'inline-block' : 'none';
        }
        
        if (downloadAnnotatedBtn) {
            downloadAnnotatedBtn.style.display = show ? 'inline-block' : 'none';
        }
    }
};

// Make UIController accessible globally
window.UIController = UIController;

// Initialize the UI controller when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    UIController.initialize();
});
