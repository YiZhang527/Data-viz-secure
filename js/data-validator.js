/**
 * data-validator.js
 * Data validation module that works with DataStore
 * Uses data already parsed by file-handler.js instead of re-parsing
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('Data Validator module initialized');

    const fileUpload = document.getElementById('file-upload');
    const validationResultsElement = document.getElementById('validation-results');

    // Initial placeholder
    if (validationResultsElement) {
        validationResultsElement.innerHTML = '<div class="placeholder-message">Upload a file to see validation results</div>';
    }

    // Add validation after file upload
    // Wait for file-handler to process the data first
    fileUpload.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            // Give file-handler time to process the file
            setTimeout(() => {
                validateData();
            }, 500);
        }
    });

    // Validate data from DataStore
    function validateData() {
        console.log('Starting validation...');

        if (validationResultsElement) {
            validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'result-card';
            loadingMessage.innerHTML = '<p>Analyzing data quality...</p>';
            validationResultsElement.appendChild(loadingMessage);
        }

        // Use data from DataStore (already parsed by file-handler.js)
        setTimeout(() => {
            if (DataStore.originalData && DataStore.originalData.length > 0) {
                performValidation(DataStore.originalData);
            } else {
                showError('No data available. Please ensure file is properly loaded.');
            }
        }, 100);
    }

    // Show error message
    function showError(message) {
        if (validationResultsElement) {
            validationResultsElement.innerHTML = '';
            const errorCard = document.createElement('div');
            errorCard.className = 'result-card error';
            errorCard.innerHTML = `
                <h4>Error</h4>
                <p>${message}</p>
            `;
            validationResultsElement.appendChild(errorCard);
        }
    }

    // Main validation logic
    function performValidation(data) {
        if (!validationResultsElement) return;
        validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';

        // Using scoring engine with DataStore data
        const result = ScoringEngine.analyzeDataQuality();
        if (result.error) {
            showError(result.error);
            return;
        }

        const headers = data[0];
        const rows = data.slice(1);
        const validationResultsArray = [];

        // Missing values check
        const missingValues = analyzeMissingValues(rows, headers);
        if (missingValues.length > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Missing Values Detected',
                description: `Found missing values in ${missingValues.length} columns: ${missingValues.join(', ')}`,
                recommendation: 'Consider filling missing values or removing incomplete rows.'
            });
        }

        // Data type consistency
        const typeIssues = analyzeDataTypes(rows, headers);
        if (typeIssues.length > 0) {
            validationResultsArray.push({
                type: 'error',
                title: 'Data Type Inconsistencies',
                description: `Inconsistent data types found in columns: ${typeIssues.join(', ')}`,
                recommendation: 'Standardize data types by converting values to consistent formats.'
            });
        }

        // Duplicate detection
        const duplicates = findDuplicates(rows);
        if (duplicates > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Duplicate Records',
                description: `Found ${duplicates} duplicate records.`,
                recommendation: 'Remove duplicate entries to ensure data integrity.'
            });
        } else {
            validationResultsArray.push({
                type: 'success',
                title: 'No Duplicates',
                description: 'Your dataset contains no duplicate records.',
                recommendation: 'Data is clean in terms of duplicates.'
            });
        }

        // Outlier detection
        const outliers = detectOutliers(rows, headers);
        if (outliers.length > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Potential Outliers',
                description: `Detected potential outliers in ${outliers.length} numeric columns.`,
                recommendation: 'Review outlier values to confirm validity.'
            });
        }

        // Data Quality Score from ScoringEngine
        const qualityScore = result.score;

        displayResults(validationResultsArray, qualityScore);
    }

    // Analyze missing values - consistent with scoring-engine logic
    function analyzeMissingValues(rows, headers) {
        const missingColumns = [];
        headers.forEach((header, colIndex) => {
            let missingCount = 0;
            rows.forEach(row => {
                // Match the exact condition from scoring-engine
                if (row[colIndex] === "" || row[colIndex] === null || row[colIndex] === undefined) {
                    missingCount++;
                }
            });
            if (missingCount > 0) {
                missingColumns.push(`${header} (${missingCount} missing)`);
            }
        });
        return missingColumns;
    }

    // Analyze data type consistency
    function analyzeDataTypes(rows, headers) {
        const typeIssues = [];
        headers.forEach((header, colIndex) => {
            const types = new Map();
            
            rows.forEach(row => {
                const value = row[colIndex];
                if (value !== "" && value !== null && value !== undefined) {
                    // Determine actual data type more accurately
                    let dataType;
                    
                    // Check if it's a string that looks like a number
                    if (typeof value === 'string') {
                        const trimmed = value.trim();
                        if (/^-?\d*\.?\d+$/.test(trimmed)) {
                            dataType = 'numeric-string';
                        } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed) || 
                                   /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                            dataType = 'date-string';
                        } else {
                            dataType = 'string';
                        }
                    } else if (typeof value === 'number') {
                        dataType = 'number';
                    } else {
                        dataType = typeof value;
                    }
                    
                    types.set(dataType, (types.get(dataType) || 0) + 1);
                }
            });
            
            // Only flag as issue if we have mixed types that matter
            // (e.g., don't flag if we have both 'number' and 'numeric-string')
            const typeKeys = Array.from(types.keys());
            const hasRealMixedTypes = typeKeys.some(t => t === 'string') && 
                                      typeKeys.some(t => t.includes('numeric') || t === 'number');
            
            if (hasRealMixedTypes) {
                typeIssues.push(`${header} (mixed: ${typeKeys.join(', ')})`);
            }
        });
        return typeIssues;
    }

    // Find duplicate records - matches scoring-engine logic
    function findDuplicates(rows) {
        const seen = new Set();
        let duplicates = 0;
        rows.forEach(row => {
            const key = JSON.stringify(row);
            if (seen.has(key)) {
                duplicates++;
            } else {
                seen.add(key);
            }
        });
        return duplicates;
    }

    // Detect outliers - matches scoring-engine accuracy check
    function detectOutliers(rows, headers) {
        const outlierColumns = [];

        headers.forEach((header, colIndex) => {
            const columnValues = [];
            let isPureNumeric = true;

            // Collect numeric values - matching scoring-engine logic
            for (let i = 0; i < rows.length; i++) {
                const val = rows[i][colIndex];
                
                if (val === "" || val === null || val === undefined) {
                    continue;
                }
                
                // Try to parse as number
                const strVal = val.toString().trim();
                const numVal = parseFloat(strVal);
                
                if (isNaN(numVal)) {
                    isPureNumeric = false;
                    break;
                }
                
                columnValues.push(numVal);
            }

            // Skip if not numeric or not enough data
            if (!isPureNumeric || columnValues.length < 2) {
                return;
            }

            // Calculate statistics
            const mean = columnValues.reduce((a, b) => a + b, 0) / columnValues.length;
            const variance = columnValues.reduce((sum, value) => 
                sum + Math.pow(value - mean, 2), 0) / columnValues.length;
            const std = Math.sqrt(variance);
            
            // Count outliers (3 standard deviations, matching scoring-engine)
            const outlierCount = columnValues.filter(val => 
                Math.abs(val - mean) > 3 * std
            ).length;
            
            if (outlierCount > 0) {
                outlierColumns.push(`${header} (${outlierCount} outliers)`);
            }
        });
        
        return outlierColumns;
    }

    // Display results
    function displayResults(results, qualityScore) {
        if (!validationResultsElement) return;
        validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';

        // Quality score card
        const scoreCard = document.createElement('div');
        scoreCard.className = `result-card ${
            qualityScore >= 80 ? 'success' : 
            qualityScore >= 60 ? 'warning' : 
            'error'
        }`;
        scoreCard.innerHTML = `
            <h4>Overall Data Quality Score</h4>
            <div class="quality-score">
                <div class="score-value">${qualityScore}%</div>
                <p>${
                    qualityScore >= 80 ? 'Excellent data quality!' :
                    qualityScore >= 60 ? 'Good data quality with room for improvement.' :
                    'Poor data quality - significant cleaning required.'
                }</p>
            </div>
        `;
        validationResultsElement.appendChild(scoreCard);

        // Individual validation results
        results.forEach(result => {
            const card = document.createElement('div');
            card.className = `result-card ${result.type}`;
            card.innerHTML = `
                <h4>${result.title}</h4>
                <p>${result.description}</p>
                <p><strong>Recommendation:</strong> ${result.recommendation}</p>
            `;
            validationResultsElement.appendChild(card);
        });
    }
});
