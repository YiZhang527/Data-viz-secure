/**
 * file-handler.js
 * Handles file upload and parsing operations
 */
const FileHandler = {
    /**
     * Initialize the file handler module
     */
    initialize: function() {
        console.log("Initializing FileHandler...");
        // Set up event listeners
        document.getElementById('file-upload').addEventListener('change', this.handleFileSelected);
    },
    
    /**
     * Handle file selection event
     * @param {Event} event - The file selection event
     */
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
            
            // Read file based on type
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsBinaryString(file);
            }
        }
    },
    
    /**
     * Process the data from the uploaded file
     * @param {string} data - The file data
     */
    processFileData: function(data) {
        console.log("Processing file data...");
        
        let jsonData;
        
        if (DataStore.currentFile.name.endsWith('.csv')) {
            // Process CSV file
            const parsed = Papa.parse(data, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
            jsonData = parsed.data;
        } else {
            // Process Excel file
            const workbook = XLSX.read(data, { 
                type: 'binary',
                cellDates: true
            });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,  
                defval: ""  
            });
        }
        
        // Store the original data
        DataStore.originalData = jsonData;
        
        // Create a simple copy that preserves dates
        DataStore.currentData = [];
        for (let i = 0; i < jsonData.length; i++) {
            DataStore.currentData[i] = [...jsonData[i]];
        }
        
        // Reset operations history
        DataStore.operations = [];
        
        // Display data cleaning options
        UIController.showDataCleaningArea();
        
        // Initialize event listeners for cleaning buttons
        DataCleaner.initialize();
        
        // Run data validation if available
        if (typeof DataValidator !== 'undefined' && DataValidator.validateData) {
            DataValidator.validateData(jsonData);
        }
    }
};
// Make FileHandler accessible globally
window.FileHandler = FileHandler;
