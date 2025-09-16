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
        
        let jsonData; // This will always be a 2D array
        
        if (DataStore.currentFile.name.endsWith('.csv')) {
            // ✅ Process CSV as 2D array (include header row)
            const parsed = Papa.parse(data, {
                header: false, // ❗ No header, so output rows as arrays
                dynamicTyping: false,
                skipEmptyLines: true
            });
            jsonData = parsed.data; // This is already a 2D array
        } else {
            // Process Excel file as 2D array
            const workbook = XLSX.read(data, { 
                type: 'binary',
                cellDates: true
            });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,  // 2D array
                defval: ""  
            });
        }
        
        // ✅ Store the original data (2D array)
        DataStore.originalData = jsonData;
        
        // ✅ Deep copy to currentData
        DataStore.currentData = jsonData.map(row => [...row]);
        
        // Reset operations history
        DataStore.operations = [];
        
        // Display data cleaning options
        UIController.showDataCleaningArea();
        
        // ✅ No validator call here (validator handles its own logic)
    }
};

// Make FileHandler accessible globally
window.FileHandler = FileHandler;
