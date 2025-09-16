/**
 * scoring-engine.js
 * Data quality scoring engine with four-dimension analysis
 * Exact match with Python logic
 */
const ScoringEngine = {
    // Main analysis function
    analyzeDataQuality: function () {
        // Get original data from DataStore
        const data = DataStore.originalData;

        // Check if data exists
        if (!data || data.length === 0) {
            return { error: "File is empty" };
        }

        // Check if only one row exists
        if (data.length === 1) {
            return { error: "Only one row, unable to analyze" };
        }

        // Separate headers and data rows
        const headers = data[0];
        const dataRows = data.slice(1);

        // Normalize data to ensure each row has same length as headers
        // This matches Python's behavior where missing cells are empty strings
        const normalizedDataRows = dataRows.map(row => {
            const normalizedRow = [];
            for (let j = 0; j < headers.length; j++) {
                // Convert undefined to empty string to match Python
                normalizedRow[j] = row[j] !== undefined ? row[j] : "";
            }
            return normalizedRow;
        });

        // Calculate four dimensions
        const uniquenessScore = ScoringEngine.calculateUniqueness(normalizedDataRows, headers);
        const completenessScore = ScoringEngine.calculateCompleteness(normalizedDataRows, headers);
        const accuracyScore = ScoringEngine.calculateAccuracy(normalizedDataRows, headers);
        const consistencyScore = ScoringEngine.calculateConsistency(normalizedDataRows, headers);

        // Calculate overall score
        let validDimensions = 0;
        let totalScore = 0;

        // Add uniqueness score if valid
        if (uniquenessScore !== null) {
            totalScore += uniquenessScore;
            validDimensions++;
        }

        // Add Completeness score if valid
        if (completenessScore !== null) {
            totalScore += completenessScore;
            validDimensions++;
        }

        // Add accuracy score if valid
        if (accuracyScore !== null) {
            totalScore += accuracyScore;
            validDimensions++;
        }

        // Add consistency score if valid
        if (consistencyScore !== null) {
            totalScore += consistencyScore;
            validDimensions++;
        }

        // Calculate average score
        const overallScore = validDimensions > 0 ? totalScore / validDimensions : 0;

        // Return only the overall score
        return {
            score: Math.round(overallScore)
        };
    },

    // Calculate uniqueness score (row-level duplicate detection)
    calculateUniqueness: function (dataRows, headers) {
        const totalRows = dataRows.length;
        const seen = new Set();

        for (let i = 0; i < dataRows.length; i++) {
            seen.add(JSON.stringify(dataRows[i]));
        }

        const uniqueRows = seen.size;
        const score = (uniqueRows / totalRows) * 100;

        return Math.round(score);
    },

    // Calculate completeness score with penalty mechanism
    calculateCompleteness: function (dataRows, headers) {
        const columnCompleteRates = [];

        // Calculate complete rate for each column
        for (let j = 0; j < headers.length; j++) {
            let missingCount = 0;

            for (let i = 0; i < dataRows.length; i++) {
                // Match Python: only check for empty string and null
                if (dataRows[i][j] === "" || dataRows[i][j] === null) {
                    missingCount++;
                }
            }

            const missingRate = missingCount / dataRows.length;
            const completeRate = (1 - missingRate) * 100;
            columnCompleteRates.push(completeRate);
        }

        // Calculate average completeness
        const avgScore = columnCompleteRates.length > 0 ? 
            columnCompleteRates.reduce((a, b) => a + b, 0) / headers.length : 0;
        
        // Find minimum completeness
        const minScore = columnCompleteRates.length > 0 ? 
            Math.min(...columnCompleteRates) : 0;

        // Apply penalty: average × sqrt(min/100)
        const score = avgScore * Math.sqrt(minScore / 100);
        
        return Math.round(score);
    },

    // Calculate accuracy score (outlier detection for numeric columns)
    calculateAccuracy: function (dataRows, headers) {
        const columnRates = [];

        // Check each column
        for (let j = 0; j < headers.length; j++) {
            let isPureNumeric = true;
            const columnValues = [];

            // Collect numeric values from this column
            for (let i = 0; i < dataRows.length; i++) {
                const val = dataRows[i][j];
                
                // Skip empty values - match Python exactly
                if (val === "" || val === null) { 
                    continue; 
                }
                
                // Try to parse as number
                let numVal;
                try {
                    const strVal = String(val).trim();
                    numVal = parseFloat(strVal);
                    
                    if (isNaN(numVal)) {
                        isPureNumeric = false;
                        break;
                    }
                    
                    columnValues.push(numVal);
                } catch (e) {
                    isPureNumeric = false;
                    break;
                }
            }

            // Skip if not numeric or empty
            if (!isPureNumeric || columnValues.length === 0) { 
                continue; 
            }

            // Calculate mean and standard deviation
            const mean = columnValues.reduce((a, b) => a + b, 0) / columnValues.length;
            const variance = columnValues.reduce((sum, value) => 
                sum + Math.pow(value - mean, 2), 0) / columnValues.length;
            const standardDeviation = Math.sqrt(variance);
            
            // Count outliers (outside 3 standard deviations)
            const outlierCount = columnValues.filter(value => 
                value < mean - 3 * standardDeviation || value > mean + 3 * standardDeviation
            ).length;
            
            // Calculate column score
            const columnScore = ((columnValues.length - outlierCount) / columnValues.length) * 100;
            columnRates.push(columnScore);
        }

        // Return null if no numeric columns
        if (columnRates.length === 0) {
            return null;
        }

        // Calculate average accuracy
        const avgScore = columnRates.reduce((a, b) => a + b, 0) / columnRates.length;
        
        // Find minimum accuracy
        const minScore = Math.min(...columnRates);

        // Apply penalty: average × sqrt(min/100)
        const score = avgScore * Math.sqrt(minScore / 100);
        
        return Math.round(score);
    },

    // Calculate consistency score (data type consistency)
    calculateConsistency: function (dataRows, headers) {
        const columnRates = [];

        // Check each column
        for (let j = 0; j < headers.length; j++) {
            const typeCount = {
                'numeric': 0,
                'text': 0,
                'date': 0,
                'boolean': 0
            };
            let nonEmptyCount = 0;

            // Analyze each value in the column
            for (let i = 0; i < dataRows.length; i++) {
                const val = dataRows[i][j];

                // Skip empty values - match Python exactly
                if (val === "" || val === null) {
                    continue;
                }

                nonEmptyCount++;
                const valStr = String(val).trim();

                // Check type - match Python logic exactly
                if (['true', 'false', 'yes', 'no'].includes(valStr.toLowerCase())) {
                    typeCount['boolean']++;
                } else if (valStr.includes('/') || valStr.includes('-')) {
                    // Simple date check - if contains digits with / or -
                    let hasDigit = false;
                    for (let c of valStr) {
                        if (c >= '0' && c <= '9') {
                            hasDigit = true;
                            break;
                        }
                    }
                    
                    if (hasDigit) {
                        typeCount['date']++;
                    } else {
                        typeCount['text']++;
                    }
                } else {
                    // Try to parse as number
                    try {
                        const numVal = parseFloat(valStr);
                        if (!isNaN(numVal) && isFinite(numVal)) {
                            typeCount['numeric']++;
                        } else {
                            typeCount['text']++;
                        }
                    } catch (e) {
                        typeCount['text']++;
                    }
                }
            }

            // Calculate consistency for this column
            let columnScore;
            if (nonEmptyCount === 0) {
                columnScore = 100; // All empty, consider as consistent
            } else {
                // Find dominant type
                const maxCount = Math.max(...Object.values(typeCount));
                columnScore = (maxCount / nonEmptyCount) * 100;
            }

            columnRates.push(columnScore);
        }

        // Calculate average consistency
        const avgScore = columnRates.length > 0 ? 
            columnRates.reduce((a, b) => a + b, 0) / columnRates.length : 0;
        
        // Find minimum consistency
        const minScore = columnRates.length > 0 ? 
            Math.min(...columnRates) : 0;

        // Apply penalty: average × sqrt(min/100)
        const score = avgScore * Math.sqrt(minScore / 100);
        
        return Math.round(score);
    }
};
