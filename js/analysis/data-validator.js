/**
 * data-validator.js
 * Data validation module that works with DataStore
 * Uses DataAnalyzer results to generate validation reports
 */

document.addEventListener('DOMContentLoaded', function () {

    const fileUpload = document.getElementById('file-upload');
    const validationResultsElement = document.getElementById('validation-results');

    if (validationResultsElement) {
        validationResultsElement.innerHTML = '<div class="placeholder-message">Upload a file to see validation results</div>';
    }

    fileUpload.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            setTimeout(() => {
                validateData();
            }, 500);
        }
    });

    function validateData() {
        if (validationResultsElement) {
            validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'result-card';
            loadingMessage.innerHTML = '<p>Analyzing data quality...</p>';
            validationResultsElement.appendChild(loadingMessage);
        }

        setTimeout(() => {
            const analysisResults = DataStore.analysisResults;
            
            if (!analysisResults) {
                showError('No analysis results available. Please ensure file is properly loaded.');
                return;
            }
            
            performValidation(analysisResults);
        }, 100);
    }

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

    function performValidation(analysisResults) {
        if (!validationResultsElement) return;
        validationResultsElement.innerHTML = '<h3>Data Validation Results</h3>';

        const validationResultsArray = [];

        // 1. Missing Values
        const missingValues = [];
        for (let [colName, colData] of Object.entries(analysisResults.columns)) {
            if (colData.quality.missingCount > 0) {
                missingValues.push(`${colName} (${colData.quality.missingCount} missing)`);
            }
        }

        if (missingValues.length > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Missing Values Detected',
                description: `Found missing values in ${missingValues.length} columns: ${missingValues.join(', ')}`,
                recommendation: 'Consider filling missing values or removing incomplete rows.'
            });
        }

        // 2. Data Type Inconsistencies
        const typeIssues = [];
        for (let [colName, colData] of Object.entries(analysisResults.columns)) {
            if (colData.dataType === "mixed") {
                typeIssues.push(colName);
            }
        }

        if (typeIssues.length > 0) {
            validationResultsArray.push({
                type: 'error',
                title: 'Data Type Inconsistencies',
                description: `Inconsistent data types found in columns: ${typeIssues.join(', ')}`,
                recommendation: 'Standardize data types by converting values to consistent formats.'
            });
        }

        // 3. Duplicate Records
        const duplicates = analysisResults.overall.duplicateRowIndices.length;

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

        // 4. Outliers
        const outliers = [];
        for (let [colName, colData] of Object.entries(analysisResults.columns)) {
            if (colData.quality.outlierCount > 0) {
                outliers.push(`${colName} (${colData.quality.outlierCount} outliers)`);
            }
        }

        if (outliers.length > 0) {
            validationResultsArray.push({
                type: 'warning',
                title: 'Potential Outliers',
                description: `Detected potential outliers in ${outliers.length} numeric columns: ${outliers.join(', ')}`,
                recommendation: 'Review outlier values to confirm validity.'
            });
        }

        // 5. Get quality score from ScoringEngine
        const scoringResult = ScoringEngine.analyzeDataQuality();
        const qualityScore = scoringResult.score;

        // Display results
        displayResults(validationResultsArray, qualityScore);
    }

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
                <div class="score-value">${qualityScore}</div>
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