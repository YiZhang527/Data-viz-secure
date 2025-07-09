/**
 * export-manager.js
 * Handles data export functionality
 */

const ExportManager = {
    initialize: function() {
        console.log("Initializing ExportManager...");
        // Set up event listeners
        document.getElementById('download-cleaned-data').addEventListener('click', this.downloadCleanedData);
    },
    
    downloadCleanedData: function() {
        console.log("Downloading cleaned data...");
        // Check if current data exists
        if (!DataStore.currentData || DataStore.currentData.length === 0) {
            alert('No cleaned data available. Please clean data first.');
            return;
        }
        
        // Convert JSON data back to worksheet
        const ws = XLSX.utils.aoa_to_sheet(DataStore.currentData);
        
        // Create a new workbook and add the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cleaned Data');
        
        // Generate the Excel file and download it
        XLSX.writeFile(wb, 'cleaned_data.xlsx');
    }
};

// Make ExportManager accessible globally
window.ExportManager = ExportManager;