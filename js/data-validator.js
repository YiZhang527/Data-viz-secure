/**
 * data-validator.js
 * Adds data validation capabilities (adapted for 2D array format)
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
    fileUpload.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            setTimeout(() => {
                validateData(e.target.files[0]);
            }, 500);
        }
    });

    // Validate uploaded file
    function validateData(file) {
        console.log('Validating file:', file.name);

        if (validationResultsElement) {
            validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'result-card';
            loadingMessage.innerHTML = '<p>Analyzing data quality...</p>';
            validationResultsElement.appendChild(loadingMessage);
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            processFileContent(content, file.name);
        };

        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsBinaryString(file);
        } else {
            showError('Unsupported file format. Please upload a CSV or Excel file.');
            return;
        }
    }

    // Process content into 2D array
    function processFileContent(content, filename) {
        let data;
        try {
            if (filename.endsWith('.csv')) {
                // CSV → 2D array
                const parsedData = Papa.parse(content, {
                    header: false,
                    dynamicTyping: true,
                    skipEmptyLines: true
                });
                data = parsedData.data;
            } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                // Excel → 2D array
                const workbook = XLSX.read(content, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            }

            performValidation(data);
        } catch (error) {
            showError('Error processing file: ' + error.message);
        }
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

        // Using scoring engine
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

        // Data Quality Score
        const qualityScore = result.score;

        displayResults(validationResultsArray, qualityScore);
    }

    // Analyze missing values
    function analyzeMissingValues(rows, headers) {
        const missingColumns = [];
        headers.forEach((header, colIndex) => {
            const missingCount = rows.filter(row => !row[colIndex] && row[colIndex] !== 0).length;
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
            const types = new Set();
            rows.forEach(row => {
                const value = row[colIndex];
                if (value !== "" && value !== null && value !== undefined) {
                    types.add(typeof value);
                }
            });
            if (types.size > 1) {
                typeIssues.push(`${header} (${Array.from(types).join(', ')})`);
            }
        });
        return typeIssues;
    }

    // Find duplicate records
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

    // Detect outliers (Z-score method) - Updated to match DataCleaner logic
    function detectOutliers(rows, headers) {
        const outlierColumns = [];

        headers.forEach((header, colIndex) => {
            const nums = [];
            const positions = [];
            let isPureNumeric = true;

            // Check if column contains pure numeric values
            for (let row = 0; row < rows.length; row++) {
                if (rows[row].length <= colIndex) continue;
                const val = rows[row][colIndex];

                if (val !== "" && val != null && val !== undefined) {
                    // Use regex to check for numeric values (can parse string numbers)
                    if (!/^-?\d*\.?\d+$/.test(val.toString().trim())) {
                        isPureNumeric = false;
                        break; // Break on non-numeric value
                    }
                    nums.push(Number(val));
                    positions.push(row);
                }
            }

            // Skip if not pure numeric or not enough data
            if (!isPureNumeric || nums.length < 2) return;

            if (nums.length > 0) {
                const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
                const std = Math.sqrt(nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / nums.length);
                const outliers = nums.filter(val => Math.abs(val - mean) > 3 * std); // Changed from 2 to 3
                if (outliers.length > 0) {
                    outlierColumns.push(`${header} (${outliers.length} outliers)`);
                }
            }
        });
        return outlierColumns;
    }

    // Calculate quality score
    function calculateQualityScore(rows, headers) {
        let score = 100;
        const totalCells = rows.length * headers.length;

        // Missing values penalty
        const missingCells = rows.reduce((count, row) => {
            return count + row.filter(cell => cell === "" || cell === null || cell === undefined).length;
        }, 0);
        score -= (missingCells / totalCells) * 30;

        // Duplicate penalty
        const duplicateCount = findDuplicates(rows);
        score -= (duplicateCount / rows.length) * 20;

        // Type issues penalty
        const typeIssues = analyzeDataTypes(rows, headers);
        score -= (typeIssues.length / headers.length) * 25;

        return Math.max(0, Math.round(score));
    }

    // Display results
    function displayResults(results, qualityScore) {
        if (!validationResultsElement) return;
        validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';

        const scoreCard = document.createElement('div');
        scoreCard.className = `result-card ${qualityScore >= 80 ? 'success' : qualityScore >= 60 ? 'warning' : 'error'}`;
        scoreCard.innerHTML = `
            <h4>Overall Data Quality Score</h4>
            <div class="quality-score">
                <div class="score-value">${qualityScore}%</div>
                <p>${qualityScore >= 80 ? 'Excellent data quality!' :
                qualityScore >= 60 ? 'Good data quality with room for improvement.' :
                    'Poor data quality - significant cleaning required.'
            }</p>
            </div>
        `;
        validationResultsElement.appendChild(scoreCard);

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
