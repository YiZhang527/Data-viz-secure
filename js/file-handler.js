/**
 * file-handler.js
 * Handles file upload and parsing operations
 */

const FileHandler = {
    initialize: function() {
        console.log("Initializing FileHandler...");
        // Set up event listeners
        document.getElementById('file-upload').addEventListener('change', this.handleFileSelected);
    },
    
    handleFileSelected: function(event) {
        const file = event.target.files[0];
        
        if (file) {
            // Store the file in DataStore
            DataStore.currentFile = file;
            
            // Update UI with file information
            UIController.updateFileInfo(file);
            
            // Create FileReader to read the file
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Process the file data
                FileHandler.processFileData(e.target.result);
            };
            
            // Read the file as binary string
            reader.readAsBinaryString(file);
        }
    },
    
    processFileData: function(data) {
        console.log("Processing file data...");
        // Parse data using xlsx library
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert worksheet to JSON format
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        // Store the original data
        DataStore.originalData = jsonData;
        
        // Show data cleaning options
        document.getElementById('data-cleaning').style.display = 'block';
    }
};

// Make FileHandler accessible globally
window.FileHandler = FileHandler;