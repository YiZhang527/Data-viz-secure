/**
 * annotated-export.js
 * Handles annotated data export functionality
 */

const AnnotatedExport = {
    /**
     * Initialize the module
     */
    initialize: function() {
        console.log("Initializing AnnotatedExport...");
        // Set up event listeners
        document.getElementById('download-annotated-data').addEventListener('click', this.downloadAnnotatedData);
    },

    /**
     * Download annotated data report that highlights data issues
     * Highlights include: empty rows (blue), outliers (red), and missing values (yellow)
     */
    downloadAnnotatedData: function() {
        console.log("Downloading annotated data...");
        
        // Check if original data exists
        if (!DataStore.originalData || DataStore.originalData.length === 0) {
            alert('No data available for annotation. Please upload a file first.');
            return;
        }
        
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Convert original data to worksheet
        const ws = XLSX.utils.aoa_to_sheet(DataStore.originalData);
        
        // Prepare style objects for highlighting
        const styles = {
            empty: { patternType: "solid", fgColor: { rgb: "9CC3FF" } },  // Light blue - empty rows
            outlier: { patternType: "solid", fgColor: { rgb: "FF9999" } }, // Light red - outliers
            missing: { patternType: "solid", fgColor: { rgb: "FFEB9C" } }  // Light yellow - missing values
        };
        
        // Initialize columns and rows properties if not existing
        if (!ws['!cols']) ws['!cols'] = [];
        if (!ws['!rows']) ws['!rows'] = [];
        
        // Add legend section at the top
        const legend = [
            ["Color Legend:"],
            ["Blue - Empty Rows"],
            ["Yellow - Missing Values"],
            ["Red - Outliers"],
            [""] // Empty row separator
        ];
        XLSX.utils.sheet_add_aoa(ws, legend, { origin: "A1" });
        
        // Get original data dimensions
        const data = DataStore.originalData;
        const headers = data[0];
        const numRows = data.length;
        const numCols = headers.length;
        const dataStartRow = legend.length;
        
        // Calculate statistics for each column (for outlier detection)
        const columnStats = this._calculateColumnStatistics(data);
        
        // Issue counters
        let counts = { emptyRows: 0, missingValues: 0, outliers: 0 };
        
        // Process each row (skip header row)
        for (let rowIndex = 1; rowIndex < numRows; rowIndex++) {
            const row = data[rowIndex];
            const adjustedRowIndex = rowIndex + dataStartRow; // Adjusted Excel row index
            
            // Check if this is an empty row
            if (this._isEmptyRow(row)) {
                counts.emptyRows++;
                this._markEmptyRow(ws, adjustedRowIndex, numCols, styles.empty);
            } else {
                // Check each cell for issues
                for (let colIndex = 0; colIndex < numCols; colIndex++) {
                    if (colIndex >= row.length) continue;
                    
                    const cellRef = XLSX.utils.encode_cell({ r: adjustedRowIndex, c: colIndex });
                    const value = row[colIndex];
                    
                    // Check for missing values
                    if (this._isMissingValue(value)) {
                        counts.missingValues++;
                        this._markCell(ws, cellRef, value, styles.missing, "Missing Value");
                    }
                    // Check for outliers in numeric columns
                    else if (this._isNumeric(value) && columnStats[colIndex]) {
                        const numValue = Number(value);
                        const { mean, stdDev } = columnStats[colIndex];
                        
                        if (stdDev > 0) {
                            const zScore = Math.abs((numValue - mean) / stdDev);
                            
                            // Mark values with z-score > 3 as outliers
                            if (zScore > 3) {
                                counts.outliers++;
                                const comment = `Outlier\nZ-score: ${zScore.toFixed(2)}\nMean: ${mean.toFixed(2)}\nStd Dev: ${stdDev.toFixed(2)}`;
                                this._markCell(ws, cellRef, value, styles.outlier, comment);
                            }
                        }
                    }
                }
            }
        }
        
        // Add summary information
        const summaryRow = dataStartRow - 1; // Last row of the legend section
        const summaryCell = XLSX.utils.encode_cell({ r: summaryRow, c: 1 });
        ws[summaryCell] = { 
            v: `Issues found: ${counts.emptyRows + counts.outliers + counts.missingValues} (Empty rows: ${counts.emptyRows}, Missing values: ${counts.missingValues}, Outliers: ${counts.outliers})` 
        };
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Annotated Data');
        
        // Generate and download the Excel file
        XLSX.writeFile(wb, 'data_issues_report.xlsx');
        
        console.log(`Annotated data report generated with ${counts.emptyRows} empty rows, ${counts.missingValues} missing values, ${counts.outliers} outliers`);
    },

    /**
     * Calculate statistics for each column (mean and standard deviation)
     * @private
     */
    _calculateColumnStatistics: function(data) {
        const stats = {};
        const numRows = data.length;
        const numCols = data[0].length;
        
        for (let colIndex = 0; colIndex < numCols; colIndex++) {
            const numericValues = [];
            
            // Collect numeric values (skip header)
            for (let rowIndex = 1; rowIndex < numRows; rowIndex++) {
                if (data[rowIndex].length <= colIndex) continue;
                
                const value = data[rowIndex][colIndex];
                if (this._isNumeric(value)) {
                    numericValues.push(Number(value));
                }
            }
            
            // Calculate mean and standard deviation if we have enough values
            if (numericValues.length >= 2) {
                const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
                const squaredDiffs = numericValues.map(val => Math.pow(val - mean, 2));
                const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / numericValues.length;
                const stdDev = Math.sqrt(variance);
                
                stats[colIndex] = { mean, stdDev };
            }
        }
        
        return stats;
    },

    /**
     * Check if a row is empty
     * @private
     */
    _isEmptyRow: function(row) {
        return row.every(cell => this._isMissingValue(cell));
    },

    /**
     * Check if a value should be considered as missing
     * @private
     */
    _isMissingValue: function(value) {
        return value === "" || value === null || value === undefined || value.toString().trim() === "";
    },

    /**
     * Check if a value is numeric
     * @private
     */
    _isNumeric: function(value) {
        return value !== "" && value !== null && value !== undefined && !isNaN(Number(value));
    },

    /**
     * Mark an entire row as empty
     * @private
     */
    _markEmptyRow: function(worksheet, rowIndex, numCols, style) {
        for (let colIndex = 0; colIndex < numCols; colIndex++) {
            const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            if (!worksheet[cellRef]) worksheet[cellRef] = { v: "" };
            
            // Apply style to all cells in the row
            if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
            worksheet[cellRef].s.fill = style;
            
            // Add note only to the first cell
            if (colIndex === 0) {
                if (!worksheet[cellRef].c) worksheet[cellRef].c = [];
                worksheet[cellRef].c.push({ t: "Empty Row" });
            }
        }
    },

    /**
     * Mark a single cell with style and comment
     * @private
     */
    _markCell: function(worksheet, cellRef, value, style, comment) {
        // Ensure cell exists
        if (!worksheet[cellRef]) worksheet[cellRef] = { v: value };
        
        // Apply style
        if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
        worksheet[cellRef].s.fill = style;
        
        // Add comment
        if (!worksheet[cellRef].c) worksheet[cellRef].c = [];
        worksheet[cellRef].c.push({ t: comment });
    }
};

// Make AnnotatedExport accessible globally
window.AnnotatedExport = AnnotatedExport;