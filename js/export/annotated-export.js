/**
 * annotated-export.js
 * Handles annotated data export functionality using ExcelJS
 */

const AnnotatedExport = {
    /**
     * Initialize the module
     */
    initialize: function() {
        setTimeout(() => {
            const downloadBtn = document.getElementById('download-annotated-data');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadAnnotatedData();
                });
            }
        }, 1000);
    },

    /**
     * Download annotated data report that highlights data issues
     * Highlights include: empty rows (blue), outliers (red), and missing values (yellow)
     */
    downloadAnnotatedData: function() {
        
        if (!DataStore.originalData || DataStore.originalData.length === 0) {
            alert('No data available for annotation. Please upload a file first.');
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Annotated Data');
            
            const colors = {
                blue: { type: 'pattern', pattern: 'solid', fgColor: { argb: '9CC3FF' } },
                yellow: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } },
                red: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9999' } }
            };
            
            worksheet.addRow(['Color Legend:']).font = { bold: true };
            
            const blueRow = worksheet.addRow(['Blue - Empty Rows']);
            blueRow.getCell(1).fill = colors.blue;
            
            const yellowRow = worksheet.addRow(['Yellow - Missing Values']);
            yellowRow.getCell(1).fill = colors.yellow;
            
            const redRow = worksheet.addRow(['Red - Outliers']);
            redRow.getCell(1).fill = colors.red;
            
            worksheet.addRow([]);
            
            const data = DataStore.originalData;
            const analysisResults = DataStore.analysisResults;
            const legendRows = 5;
            
            const headers = data[0];
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true };
            
            // Use analysisResults instead of calculating statistics
            const emptyRowSet = new Set(analysisResults.overall.emptyRowIndices);
            
            let counts = { emptyRows: 0, missingValues: 0, outliers: 0 };
            
            for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
                const dataRow = data[rowIndex];
                const excelRow = worksheet.addRow(dataRow);
                
                // Check if this is an empty row (from analysisResults)
                if (emptyRowSet.has(rowIndex)) {
                    counts.emptyRows++;
                    
                    excelRow.eachCell((cell) => {
                        cell.fill = colors.blue;
                    });
                    
                    excelRow.getCell(1).note = {
                        texts: [{ text: 'Empty Row' }],
                        margins: { insetmode: 'auto' }
                    };
                } else {
                    // Check each cell for issues using cellIssues map
                    for (let colIndex = 0; colIndex < dataRow.length; colIndex++) {
                        const cell = excelRow.getCell(colIndex + 1);
                        const cellKey = `${rowIndex},${colIndex}`;
                        const issue = analysisResults.cellIssues[cellKey];
                        
                        if (issue === "missing") {
                            counts.missingValues++;
                            cell.fill = colors.yellow;
                            cell.note = {
                                texts: [{ text: 'Missing Value' }],
                                margins: { insetmode: 'auto' }
                            };
                        } else if (issue === "outlier") {
                            counts.outliers++;
                            
                            // Get column name to find stats
                            const colName = headers[colIndex];
                            const colStats = analysisResults.columns[colName].stats;
                            const value = Number(dataRow[colIndex]);
                            const zScore = Math.abs((value - colStats.mean) / colStats.stdDev);
                            
                            cell.fill = colors.red;
                            cell.note = {
                                texts: [{ 
                                    text: `Outlier\nZ-score: ${zScore.toFixed(2)}\nMean: ${colStats.mean.toFixed(2)}\nStd Dev: ${colStats.stdDev.toFixed(2)}` 
                                }],
                                margins: { insetmode: 'auto' }
                            };
                        }
                    }
                }
            }
            
            const summaryRow = worksheet.getRow(legendRows);
            summaryRow.getCell(2).value = `Issues found: ${counts.emptyRows + counts.outliers + counts.missingValues} (Empty rows: ${counts.emptyRows}, Missing values: ${counts.missingValues}, Outliers: ${counts.outliers})`;
            
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, cell => {
                    const length = cell.value ? cell.value.toString().length : 10;
                    if (length > maxLength) {
                        maxLength = length;
                    }
                });
                column.width = Math.min(maxLength + 2, 30);
            });
            
            workbook.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'data_issues_report.xlsx';
                a.click();
                
                window.URL.revokeObjectURL(url);
            });
        } catch (error) {
            alert("Error creating annotated data report: " + error.message);
        }
    }
};

window.AnnotatedExport = AnnotatedExport;