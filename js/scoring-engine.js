/**
 * scoring-engine.js
 * Data quality scoring engine with four-dimension analysis
 */
const ScoringEngine = {
    // Main analysis function
    analyzeDataQuality: function () {
        console.log("Starting data quality analysis");

        // Get original data from DataStore
        const data = DataStore.originalData;

        // Check if data exists
        if (data.length === 0) {
            return { error: "File is empty" };
        }

        // Check if only one row exists
        if (data.length === 1) {
            return { error: "Only one row, unable to analyze" };
        }

        // Separate headers and data rows
        const headers = data[0];
        const dataRows = data.slice(1);

        // Calculate four dimensions
        console.log("Calculating uniqueness...");

        // 1. Uniqueness - check duplicate rows
        const uniquenessScore = ScoringEngine.calculateUniqueness(dataRows);

        // 2. Completeness - check missing values
        const completenessScore = ScoringEngine.calculateCompleteness(dataRows, headers);

        // 3. Accuracy - check outliers(numeric columns only)
        const accuracyScore = ScoringEngine.calculateAccuracy(dataRows, headers);

        // 4. Consistency - check format patterns
        const consistencyScore = ScoringEngine.calculateConsistency(dataRows);

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

        //Add consistency score if valid
        if (consistencyScore !== null) {
            totalScore += consistencyScore;
            validDimensions++;
        }

        // Calculate average score
        const overallScore = validDimensions > 0 ? totalScore / validDimensions : 0;

        // Return results
        return {
            score: Math.round(overallScore)
        };

    }, // Main function ends

    // Calculate uniqueness score(duplicate detection)
    calculateUniqueness: function (dataRows) {
        const totalRows = dataRows.length;
        const seen = new Set();

        for (let i = 0; i < dataRows.length; i++) {
            seen.add(JSON.stringify(dataRows[i]));
        }

        const uniqueRows = seen.size;
        const score = (uniqueRows / totalRows) * 100;

        return Math.round(score);
    },

    // Calculate completeness score(missing value detection)
    calculateCompleteness: function (dataRows, headers) {
        let columnMissingRates = [];

        // Calculate missing rate for each column
        for (let j = 0; j < headers.length; j++) {
            let missingCount = 0;

            for (let i = 0; i < dataRows.length; i++) {
                if (dataRows[i][j] === "" || dataRows[i][j] === null || dataRows[i][j] === undefined) {
                    missingCount++;
                }
            }

            const missingRate = missingCount / dataRows.length;
            columnMissingRates.push(missingRate);
        }

        // Calculate average missing Rate
        const avgMissingRate = columnMissingRates.reduce((a, b) => a + b, 0) / headers.length;

        // Calculated completeness score
        const score = (1 - avgMissingRate) * 100;
        return Math.round(score);
    },

    // Calculate accuracy score (outlier detection for numeric colomns)
    calculateAccuracy: function (dataRows, headers) {
        let outlierCount = 0;
        let totalNumericCells = 0;

        // Check each column
        for (let j = 0; j < headers.length; j++) {
            let isPureNumeric = true;
            const columnValues = [];

            // Collect numeric values from this column
            for (let i = 0; i < dataRows.length; i++) {
                const val = dataRows[i][j];
                // Check for empty values
                if (val === "" || val === null || val === undefined) { continue; }
                // Check if it is a number
                if (!/^-?\d*\.?\d+$/.test(val.toString().trim())) {
                    isPureNumeric = false;
                    break; // Not a numeric column, skip it
                }
                columnValues.push(parseFloat(val));
            }

            if (!isPureNumeric || columnValues.length === 0) { continue; }
            // Update total numeric cells
            totalNumericCells += columnValues.length;
            // Calculate mean and standard deviation
            const mean = columnValues.reduce((a, b) => a + b, 0) / columnValues.length;
            const standardDeviation = Math.sqrt(columnValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) / columnValues.length);
            // Count outliers
            outlierCount += columnValues.filter(value => value < mean - 3 * standardDeviation || value > mean + 3 * standardDeviation).length;
        }

        const score = totalNumericCells === 0 ? null : (totalNumericCells - outlierCount) / totalNumericCells * 100;
        return score === null ? null : Math.round(score);
    },

    // Calculate consistency score
    calculateConsistency: function (dataRows) {
        // TODO: after the discussion
        // return null temprately
        return null;
    }

}