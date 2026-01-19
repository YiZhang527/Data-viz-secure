/**
 * cleaned-export.js
 * Handles data export functionality
 */
const ExportManager = {
    
    downloadCleanedData: function() {
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
        // Just add these two options to preserve date formatting
        XLSX.writeFile(wb, 'cleaned_data.xlsx', {
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
        });
    }
};
// Make ExportManager accessible globally
window.ExportManager = ExportManager;
