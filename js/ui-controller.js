/**
 * ui-controller.js
 * Manages UI updates and interactions
 */

// Create UIController object
const UIController = {
    // Initialize UI
    initialize: function() {
        console.log("Initializing UIController...");
        
        // Hide cleaning options initially
        const dataCleaning = document.getElementById('data-cleaning');
        if (dataCleaning) {
            dataCleaning.style.display = 'block';
        }
    },
    
    // Update file info display
    updateFileInfo: function(file) {
        console.log("Updating file info...");
        const fileInfoDisplay = document.getElementById('file-info-display');
        
        if (fileInfoDisplay) {
            fileInfoDisplay.innerHTML = `
                <h3>Selected File:</h3>
                <p>File name: ${file.name}</p>
                <p>File size: ${(file.size / 1024).toFixed(2)} KB</p>
                <p>Last modified: ${new Date(file.lastModified).toLocaleString()}</p>
            `;
        }
        
        // Show cleaning options
        this.showDataCleaningArea();
    },
    
    // Show data cleaning options
    showDataCleaningArea: function() {
        console.log("Showing data cleaning area");
        const dataCleaning = document.getElementById('data-cleaning');
        
        if (dataCleaning) {
            dataCleaning.innerHTML = `
                <h3>Data Cleaning Options</h3>
                <div>
                    <button id="remove-empty-rows" class="clean-btn">Remove Empty Rows</button>
                    <button id="remove-duplicate-rows" class="clean-btn">Remove Duplicate Rows</button>
                    <button id="detect-outliers" class="clean-btn">Detect Outliers</button>
                    <button id="download-cleaned-data" class="clean-btn" >Download Cleaned Data</button>
                    <button id="download-annotated-data" class="clean-btn" >Download Annotated Data</button>
                </div>
                <div id="cleaning-results"></div>
            `;
            
            // Add event listeners
            if (typeof DataCleaner !== 'undefined') {
                const removeEmptyRowsBtn = document.getElementById('remove-empty-rows');
                if (removeEmptyRowsBtn) {
                    removeEmptyRowsBtn.addEventListener('click', DataCleaner.removeEmptyRows);
                }
                const removeDuplicateRowsBtn = document.getElementById('remove-duplicate-rows');
if (removeDuplicateRowsBtn) {
    removeDuplicateRowsBtn.addEventListener('click', DataCleaner.removeDuplicateRows);
}

                
                const detectOutliersBtn = document.getElementById('detect-outliers');
                if (detectOutliersBtn) {
                    detectOutliersBtn.addEventListener('click', DataCleaner.detectOutliers);
                }
            }
            
            if (typeof ExportManager !== 'undefined') {
                const downloadCleanedBtn = document.getElementById('download-cleaned-data');
                if (downloadCleanedBtn) {
                    downloadCleanedBtn.addEventListener('click', ExportManager.downloadCleanedData);
                }
            }
            
            if (typeof AnnotatedExport !== 'undefined') {
                const downloadAnnotatedBtn = document.getElementById('download-annotated-data');
                if (downloadAnnotatedBtn) {
                    downloadAnnotatedBtn.addEventListener('click', function() {
                        AnnotatedExport.downloadAnnotatedData();
                    });
                }
            }
        }
    },
    
    // Display cleaning results
    displayCleaningResults: function(results) {
        console.log("Displaying cleaning results...");
        const resultsDiv = document.getElementById('cleaning-results');
        
        if (resultsDiv) {
            resultsDiv.innerHTML = results.message;
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
        }
    },
    
    // Update download buttons visibility
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
    console.log("DOM Content Loaded - Initializing UI");
    UIController.initialize();
});
