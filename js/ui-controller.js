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
       const fileInfoDisplay = document.getElementById('file-info-display');
       
       if (fileInfoDisplay) {
           fileInfoDisplay.innerHTML = `
               <h3>Selected File:</h3>
               <p>File name: ${file.name}</p>
               <p>File size: ${(file.size / 1024).toFixed(2)} KB</p>
               <p>File type: ${file.type || 'Unknown'}</p>
               <p>Last modified: ${new Date(file.lastModified).toLocaleString()}</p>
           `;
           
           // Make file info visible in case it was hidden
           fileInfoDisplay.style.display = 'block';
       }
       
       // Make sure data cleaning area is visible when a file is loaded
       this.showDataCleaningArea();
   },
   
   // Show data cleaning area and add cleaning buttons
   showDataCleaningArea: function() {
    const dataCleaning = document.getElementById('data-cleaning');
    if (dataCleaning) {
        // Replace placeholder with actual cleaning options
        dataCleaning.innerHTML = `
            <div>
                <button id="remove-empty-rows" class="clean-btn">Remove Empty Rows</button>
                <button id="detect-outliers" class="clean-btn">Detect Outliers</button>
                <button id="download-cleaned-data" class="clean-btn" style="display: none;">Download Cleaned Data</button>
                <button id="download-annotated-data" class="clean-btn" style="display: none;">Download Data Issues Report</button>
            </div>
            <div id="cleaning-results"></div>
        `;
        dataCleaning.style.display = 'block';
    }
}
   
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
