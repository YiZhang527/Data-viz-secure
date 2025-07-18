/**
 * data-validator.js - Integration with DataValidator AI functionalities
 * This file adds data validation capabilities to the platform
 */

// Initialize validation capabilities
document.addEventListener('DOMContentLoaded', function() {
    console.log('Data Validator module initialized');
    
    // Get references to DOM elements
    const fileUpload = document.getElementById('file-upload');
    const validationResultsElement = document.getElementById('validation-results');
    
    // Setup initial state of validation results area
    if (validationResultsElement) {
        validationResultsElement.innerHTML = '<div class="placeholder-message">Upload a file to see validation results</div>';
    }
    
    // Add validation functionality to the existing file upload handler
    fileUpload.addEventListener('change', function(e) {
        // The original handler in file-handler.js will still run
        if (e.target.files.length > 0) {
            setTimeout(() => {
                // Wait a bit for the original handler to process the file
                validateData(e.target.files[0]);
            }, 500);
        }
    });
    
    // Function to validate data
    function validateData(file) {
        console.log('Validating file:', file.name);
        
        // Clear previous validation results
        if (validationResultsElement) {
            validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';
            
            // Show validation is in progress
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'result-card';
            loadingMessage.innerHTML = '<p>Analyzing data quality...</p>';
            validationResultsElement.appendChild(loadingMessage);
        }
        
        // Read and process the file
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            processFileContent(content, file.name);
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsBinaryString(file);
        } else {
            if (validationResultsElement) {
                const loadingMessage = validationResultsElement.querySelector('.result-card');
                if (loadingMessage) loadingMessage.remove();
                showError('Unsupported file format. Please upload a CSV or Excel file.');
            }
            return;
        }
    }
    
    // Process file content based on type
    function processFileContent(content, filename) {
        let data;
        
        try {
            if (filename.endsWith('.csv')) {
                // Parse CSV using PapaParse
                const parsedData = Papa.parse(content, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true
                });
                data = parsedData.data;
            } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
                // Parse Excel using SheetJS
                const workbook = XLSX.read(content, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                data = XLSX.utils.sheet_to_json(worksheet);
            }
            
            // Perform the validation once we have the data
            performValidation(data);
            
        } catch (error) {
            showError('Error processing file: ' + error.message);
        }
    }
    
    // Show error message in validation results area
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
    
    // Perform the actual validation on the data
    function performValidation(data) {
        if (!validationResultsElement) return;
        
        // Remove loading message
        validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';
        
        if (!data || data.length === 0) {
            showError('The uploaded file contains no data rows.');
            return;
        }
        
        // Get column names
        const columns = Object.keys(data[0]);
        
        // Analyze the data for quality issues
        const validationResultsArray = []; // 重命名为validationResultsArray，避免冲突
        
        // 1. Missing Values Analysis
        const missingValues = analyzeMissingValues(data, columns);
        if (missingValues.length > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Missing Values Detected',
                description: `Found missing values in ${missingValues.length} columns: ${missingValues.join(', ')}`,
                recommendation: 'Consider filling missing values with appropriate defaults, mean/median values, or removing incomplete rows.'
            });
        }
        
        // 2. Data Type Consistency
        const typeIssues = analyzeDataTypes(data, columns);
        if (typeIssues.length > 0) {
            validationResultsArray.push({
                type: 'error',
                title: 'Data Type Inconsistencies',
                description: `Inconsistent data types found in columns: ${typeIssues.join(', ')}`,
                recommendation: 'Standardize data types by converting values to consistent formats.'
            });
        }
        
        // 3. Duplicate Detection
        const duplicates = findDuplicates(data);
        if (duplicates > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Duplicate Records',
                description: `Found ${duplicates} duplicate records in the dataset.`,
                recommendation: 'Review and remove duplicate entries to ensure data integrity.'
            });
        } else {
            validationResultsArray.push({
                type: 'success',
                title: 'No Duplicates',
                description: 'Your dataset contains no duplicate records.',
                recommendation: 'Data is clean in terms of duplicates.'
            });
        }
        
        // 4. Outlier Detection
        const outliers = detectOutliers(data, columns);
        if (outliers.length > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Potential Outliers',
                description: `Detected potential outliers in ${outliers.length} numeric columns.`,
                recommendation: 'Review outlier values to determine if they are valid data points or errors.'
            });
        }
        
        // 5. Data Quality Score
        const qualityScore = calculateQualityScore(data, columns);
        
        // Display all validation results
        displayResults(validationResultsArray, qualityScore);
    }
    
    // Analyze missing values in the data
    function analyzeMissingValues(data, columns) {
        const missingColumns = [];
        columns.forEach(col => {
            const missingCount = data.filter(row => 
                row[col] === null || row[col] === undefined || row[col] === ''
            ).length;
            if (missingCount > 0) {
                missingColumns.push(`${col} (${missingCount} missing)`);
            }
        });
        return missingColumns;
    }
    
    // Analyze data type consistency
    function analyzeDataTypes(data, columns) {
        const typeIssues = [];
        columns.forEach(col => {
            const types = new Set();
            data.forEach(row => {
                if (row[col] !== null && row[col] !== undefined && row[col] !== '') {
                    types.add(typeof row[col]);
                }
            });
            if (types.size > 1) {
                typeIssues.push(`${col} (${Array.from(types).join(', ')})`);
            }
        });
        return typeIssues;
    }
    
    // Find duplicate records
    function findDuplicates(data) {
        const seen = new Set();
        let duplicates = 0;
        data.forEach(row => {
            const key = JSON.stringify(row);
            if (seen.has(key)) {
                duplicates++;
            } else {
                seen.add(key);
            }
        });
        return duplicates;
    }
    
    // Detect outliers using z-score method
    function detectOutliers(data, columns) {
        const outlierColumns = [];
        columns.forEach(col => {
            const values = data.map(row => row[col]).filter(val => typeof val === 'number');
            if (values.length > 0) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
                const outliers = values.filter(val => Math.abs(val - mean) > 2 * std);
                if (outliers.length > 0) {
                    outlierColumns.push(`${col} (${outliers.length} outliers)`);
                }
            }
        });
        return outlierColumns;
    }
    
    // Calculate overall data quality score
    function calculateQualityScore(data, columns) {
        let score = 100;
        
        // Penalize missing values
        const totalCells = data.length * columns.length;
        const missingCells = data.reduce((count, row) => {
            return count + columns.filter(col => 
                row[col] === null || row[col] === undefined || row[col] === ''
            ).length;
        }, 0);
        score -= (missingCells / totalCells) * 30;
        
        // Penalize duplicates
        const duplicateCount = findDuplicates(data);
        score -= (duplicateCount / data.length) * 20;
        
        // Penalize type inconsistencies
        const typeIssues = analyzeDataTypes(data, columns);
        score -= (typeIssues.length / columns.length) * 25;
        
        return Math.max(0, Math.round(score));
    }
    
    // Display validation results
    function displayResults(results, qualityScore) {
        if (!validationResultsElement) return;
        
        // Add quality score card at the top
        const scoreCard = document.createElement('div');
        scoreCard.className = `result-card ${qualityScore >= 80 ? 'success' : qualityScore >= 60 ? 'warning' : 'error'}`;
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
        
        // Add other result cards
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
