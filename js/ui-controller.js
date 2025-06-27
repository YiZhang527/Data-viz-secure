/**
 * ui-controller.js
 * Manages UI updates and interactions
 */

const UIController = {
    initialize: function() {
        console.log("Initializing UIController...");
        // Set up any UI-related event listeners
    },
    
    updateFileInfo: function(file) {
        console.log("Updating file info...");
        const fileInfoDisplay = document.getElementById('file-info-display');
        fileInfoDisplay.innerHTML = `
            <h3>Selected File:</h3>
            <p>File name: ${file.name}</p>
            <p>File size: ${(file.size / 1024).toFixed(2)} KB</p>
        `;
    },
    
    displayCleaningResults: function(results) {
        console.log("Displaying cleaning results...");
        const resultsDiv = document.getElementById('cleaning-results');
        resultsDiv.innerHTML = results.message;
    },
    
    displayOutlierResults: function(columnResults, totalOutliers) {
        console.log("Displaying outlier results...");
        const resultsDiv = document.getElementById('cleaning-results');
        
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
    }
};

// Make UIController accessible globally
window.UIController = UIController;