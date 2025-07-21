/**
 * annotated-export.js
 * Handles annotated data export functionality using ExcelJS
 */

const AnnotatedExport = {
    /**
 * Initialize the module
 */
initialize: function() {
    console.log("Initializing AnnotatedExport...");
    // Set up event listeners with delay to ensure DOM elements exist
    setTimeout(() => {
        const downloadBtn = document.getElementById('download-annotated-data');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadAnnotatedData();
            });
            console.log("Annotated data download button event listener attached");
        }
    }, 1000);
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

        try {
            // Create a new workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Annotated Data');
            
            // Define color schemes
            const colors = {
                blue: { type: 'pattern', pattern: 'solid', fgColor: { argb: '9CC3FF' } },     // Empty rows
                yellow: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } },   // Missing values
                red: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9999' } }       // Outliers
            };
            
            // Add legend section at the top
            worksheet.addRow(['Color Legend:']).font = { bold: true };
            
            const blueRow = worksheet.addRow(['Blue - Empty Rows']);
            blueRow.getCell(1).fill = colors.blue;
            
            const yellowRow = worksheet.addRow(['Yellow - Missing Values']);
            yellowRow.getCell(1).fill = colors.yellow;
            
            const redRow = worksheet.addRow(['Red - Outliers']);
            redRow.getCell(1).fill = colors.red;
            
            // Add empty row as separator
            worksheet.addRow([]);
            
            // Get original data
            const data = DataStore.originalData;
            const legendRows = 5; // Number of rows used for the legend
            
            // Add headers
            const headers = data[0];
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            
            // Calculate statistics for each column (for outlier detection)
            const columnStats = this._calculateColumnStatistics(data);
            
            // Issue counters
            let counts = { emptyRows: 0, missingValues: 0, outliers: 0 };
            
            // Process each row (skip header row)
            for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
                const dataRow = data[rowIndex];
                const excelRow = worksheet.addRow(dataRow);
                
                // Check if this is an empty row
                if (this._isEmptyRow(dataRow)) {
                    counts.emptyRows++;
                    
                    // Apply blue fill to all cells in the row
                    excelRow.eachCell((cell) => {
                        cell.fill = colors.blue;
                    });
                    
                    // Add note to the first cell
                    excelRow.getCell(1).note = {
                        texts: [{ text: 'Empty Row' }],
                        margins: { insetmode: 'auto' }
                    };
                } else {
                    // Check each cell for issues
                    for (let colIndex = 0; colIndex < dataRow.length; colIndex++) {
                        const value = dataRow[colIndex];
                        const cell = excelRow.getCell(colIndex + 1); // ExcelJS uses 1-based indexing
                        
                        // Check for missing values
                        if (this._isMissingValue(value)) {
                            counts.missingValues++;
                            cell.fill = colors.yellow;
                            cell.note = {
                                texts: [{ text: 'Missing Value' }],
                                margins: { insetmode: 'auto' }
                            };
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
                                    cell.fill = colors.red;
                                    cell.note = {
                                        texts: [{ 
                                            text: `Outlier\nZ-score: ${zScore.toFixed(2)}\nMean: ${mean.toFixed(2)}\nStd Dev: ${stdDev.toFixed(2)}` 
                                        }],
                                        margins: { insetmode: 'auto' }
                                    };
                                }
                            }
                        }
                    }
                }
            }
            
            // Add summary information
            const summaryRow = worksheet.getRow(legendRows);
            summaryRow.getCell(2).value = `Issues found: ${counts.emptyRows + counts.outliers + counts.missingValues} (Empty rows: ${counts.emptyRows}, Missing values: ${counts.missingValues}, Outliers: ${counts.outliers})`;
            
            // Auto-size columns
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, cell => {
                    const length = cell.value ? cell.value.toString().length : 10;
                    if (length > maxLength) {
                        maxLength = length;
                    }
                });
                column.width = Math.min(maxLength + 2, 30); // Limit width to 30
            });
            
            // Generate and download the Excel file
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'data_issues_report.xlsx';
                a.click();
                
                window.URL.revokeObjectURL(url);
                console.log(`Annotated data report generated with ${counts.emptyRows} empty rows, ${counts.missingValues} missing values, ${counts.outliers} outliers`);
            });
        } catch (error) {
            console.error("Error generating Excel file:", error);
            alert("Error creating annotated data report: " + error.message);
        }
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
    }
};

// Make AnnotatedExport accessible globally
window.AnnotatedExport = AnnotatedExport;
