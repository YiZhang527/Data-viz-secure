/**
 * data-cleaner.js
 * Implements data cleaning operations
 */

const DataCleaner = {
    initialize: function () {
        console.log("Initializing DataCleaner...");
        // Set up event listeners
        document.getElementById('remove-empty-rows').addEventListener('click', this.removeEmptyRows);
        document.getElementById('detect-outliers').addEventListener('click', this.detectOutliers);
    },

    removeEmptyRows: function () {
        console.log("Removing empty rows...");
        // Check if data exists
        if (!DataStore.currentData || DataStore.currentData.length === 0) {
            alert('Please upload a file first.');
            return;
        }

        // Get the current data (previously processed data or original)
        const data = DataStore.currentData;

        // Create an array to store the cleaned data
        const cleanedData = [];

        // Loop through all rows
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            let rowHasData = false;

            // Check if the row has any non-empty cells
            for (let j = 0; j < row.length; j++) {
                if (row[j] !== "" && row[j].toString().trim() !== "") {
                    rowHasData = true;
                    break;
                }
            }

            // If the row has data, keep this row
            if (rowHasData) {
                cleanedData.push(row);
            }
        }

        // Save the cleaned data as the new current data
        DataStore.currentData = cleanedData;

        // Update operations list
        if (!DataStore.operations.includes("Remove Empty Rows")) {
            DataStore.operations.push("Remove Empty Rows");
        }

        // Calculate the number of removed rows
        const removedRowsCount = data.length - cleanedData.length;

        // Display results
        UIController.displayCleaningResults({
            message: `Removed ${removedRowsCount} empty row${removedRowsCount !== 1 ? 's' : ''}.<br>` +
                `Current data: ${cleanedData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
                `Applied operations: ${DataStore.operations.join(", ")}`
        });

        // Show download button
        document.getElementById('download-cleaned-data').style.display = 'inline-block';
    },

    detectOutliers: function () {
        console.log("Detecting outliers...");
        // Check if data has been loaded
        if (!DataStore.currentData || DataStore.currentData.length === 0) {
            alert('Please upload a file first.');
            return;
        }

        // Get the current data (previously processed data or original)
        const data = DataStore.currentData;

        // Create a copy of the data for cleaning
        const cleanedData = JSON.parse(JSON.stringify(data));

        // Assume the first row is the header
        const headers = data[0];

        // Track outlier information
        let totalOutliers = 0;
        let columnResults = [];

        // Loop through all columns
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            // Collect numeric values for this column
            const numericValues = [];
            const valuePositions = []; // Record the row index for each value

            // Start from the second row (skip header)
            for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
                if (data[rowIndex].length <= colIndex) continue;

                const value = data[rowIndex][colIndex];
                if (value !== "" && !isNaN(Number(value))) {
                    numericValues.push(Number(value));
                    valuePositions.push(rowIndex);
                }
            }

            // If there's not enough numeric data, skip this column
            if (numericValues.length < 2) continue;

            // Calculate mean and standard deviation
            const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
            const squaredDiffs = numericValues.map(val => Math.pow(val - mean, 2));
            const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / numericValues.length;
            const stdDev = Math.sqrt(variance);

            // Use Z-score method to detect outliers
            const outliers = [];

            for (let i = 0; i < numericValues.length; i++) {
                const value = numericValues[i];
                const rowIndex = valuePositions[i];
                const zScore = (value - mean) / stdDev;

                // If Z-score exceeds ±3, consider it an outlier
                if (Math.abs(zScore) > 3) {
                    outliers.push({
                        row: rowIndex,
                        value: value,
                        zScore: zScore
                    });

                    // Replace outliers with null in the cleaned data
                    cleanedData[rowIndex][colIndex] = null;
                }
            }

            // Update statistics
            totalOutliers += outliers.length;

            // Record results for this column
            if (outliers.length > 0) {
                const columnName = headers[colIndex] || `Column ${colIndex + 1}`;
                columnResults.push({
                    name: columnName,
                    outlierCount: outliers.length,
                    mean: mean,
                    stdDev: stdDev
                });
            }
        }

        // Save the cleaned data as the new current data
        DataStore.currentData = cleanedData;

        // Update operations list
        if (!DataStore.operations.includes("Detect Outliers")) {
            DataStore.operations.push("Detect Outliers");
        }

        // Display results with current data information
        UIController.displayOutlierResults(columnResults, totalOutliers);

        // Add information about current data state
        document.getElementById('cleaning-results').innerHTML +=
            `<p>Current data: ${cleanedData.length} rows (Original: ${DataStore.originalData.length} rows)<br>
             Applied operations: ${DataStore.operations.join(", ")}</p>`;

        // Show download button
        if (totalOutliers > 0) {
            document.getElementById('download-cleaned-data').style.display = 'inline-block';
        }
    }
};

// Make DataCleaner accessible globally
window.DataCleaner = DataCleaner;