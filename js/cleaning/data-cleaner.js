const DataCleaner = {

    removeEmptyRows: function () {

        // Return if already done
        if (DataStore.operations.includes("Remove Empty Rows")) {
            // Show the previously saved message if exists
            if (DataStore.cleaningResults && DataStore.cleaningResults.removeEmptyRowsMessage) {
                UIController.displayCleaningResults({
                    message: DataStore.cleaningResults.removeEmptyRowsMessage
                });
            } else {
                // Fallback message
                UIController.displayCleaningResults({
                    message: "Remove Empty Rows operation already applied.<br>" +
                        `Current data: ${DataStore.currentData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
                        `Applied operations: ${DataStore.operations.join(", ")}`
                });
            }
            return;
        }

        // Check if data exists
        if (!DataStore.currentData || DataStore.currentData.length === 0) {
            alert('Please upload a file first.');
            return;
        }

        const data = DataStore.currentData;
        const cleanedData = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            let hasData = false;

            for (let j = 0; j < row.length; j++) {
                if (row[j] !== "" && row[j].toString().trim() !== "") {
                    hasData = true;
                    break;
                }
            }

            if (hasData) {
                cleanedData.push(row);
            }
        }

        DataStore.currentData = cleanedData;
        DataStore.operations.push("Remove Empty Rows");

        const removedCount = data.length - cleanedData.length;

        // Prepare message and save it for future reuse
        const message = `Removed ${removedCount} empty row${removedCount !== 1 ? 's' : ''}.<br>` +
            `Current data: ${cleanedData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
            `Applied operations: ${DataStore.operations.join(", ")}`;

        if (!DataStore.cleaningResults) DataStore.cleaningResults = {};
        DataStore.cleaningResults.removeEmptyRowsMessage = message;

        UIController.displayCleaningResults({
            message: message
        });

    },

    removeDuplicateRows: function () {

        if (DataStore.operations.includes("Remove Duplicate Rows")) {
            if (DataStore.cleaningResults && DataStore.cleaningResults.removeDuplicateRowsMessage) {
                UIController.displayCleaningResults({
                    message: DataStore.cleaningResults.removeDuplicateRowsMessage
                });
            } else {
                UIController.displayCleaningResults({
                    message: "Remove Duplicate Rows operation already applied.<br>" +
                        `Current data: ${DataStore.currentData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
                        `Applied operations: ${DataStore.operations.join(", ")}`
                });
            }
            return;
        }

        if (!DataStore.currentData || DataStore.currentData.length === 0) {
            alert('Please upload a file first.');
            return;
        }

        const data = DataStore.currentData;
        const seen = new Set();
        const cleanedData = [];

        for (let i = 0; i < data.length; i++) {
            const rowStr = JSON.stringify(data[i]);
            if (!seen.has(rowStr)) {
                seen.add(rowStr);
                cleanedData.push(data[i]);
            }
        }

        DataStore.currentData = cleanedData;
        DataStore.operations.push("Remove Duplicate Rows");

        const removedCount = data.length - cleanedData.length;

        const message = `Removed ${removedCount} duplicate row${removedCount !== 1 ? 's' : ''}.<br>` +
            `Current data: ${cleanedData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
            `Applied operations: ${DataStore.operations.join(", ")}`;

        if (!DataStore.cleaningResults) DataStore.cleaningResults = {};
        DataStore.cleaningResults.removeDuplicateRowsMessage = message;

        UIController.displayCleaningResults({
            message: message
        });
    },


    detectOutliers: function () {

        // Return if already done
        if (DataStore.operations.includes("Detect Outliers")) {
            if (DataStore.cleaningResults && DataStore.cleaningResults.detectOutliersResults) {
                UIController.displayOutlierResults(
                    DataStore.cleaningResults.detectOutliersResults.columnResults,
                    DataStore.cleaningResults.detectOutliersResults.totalOutliers
                );
                document.getElementById('cleaning-results').innerHTML +=
                    `Current data: ${DataStore.currentData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
                    `Applied operations: ${DataStore.operations.join(", ")}</p>`;
            } else {
                // Fallback empty display
                UIController.displayOutlierResults([], 0);
                document.getElementById('cleaning-results').innerHTML +=
                    `<p>Detect Outliers operation already applied.<br>` +
                    `Current data: ${DataStore.currentData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
                    `Applied operations: ${DataStore.operations.join(", ")}</p>`;
            }
            return;
        }

        if (!DataStore.currentData || DataStore.currentData.length === 0) {
            alert('Please upload a file first.');
            return;
        }

        const data = DataStore.currentData;
        const cleanedData = JSON.parse(JSON.stringify(data));
        const headers = data[0];

        let totalOutliers = 0;
        let columnResults = [];

        for (let col = 0; col < headers.length; col++) {
    const nums = [];
    const positions = [];
    let isPureNumeric = true;
    
    for (let row = 1; row < data.length; row++) {
        if (data[row].length <= col) continue;
        const val = data[row][col];
        if (val !== "" && val != null) {
            if (!/^-?\d*\.?\d+$/.test(val.toString().trim())) {
                isPureNumeric = false;
                break; // Break on non-numeric value
            }
            nums.push(Number(val));
            positions.push(row);
        }
    }
    
    if (!isPureNumeric || nums.length < 2) continue;

            const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
            const sqDiffs = nums.map(v => (v - mean) ** 2);
            const variance = sqDiffs.reduce((a, b) => a + b, 0) / nums.length;
            const stdDev = Math.sqrt(variance);

            const outliers = [];

            for (let i = 0; i < nums.length; i++) {
                const val = nums[i];
                const rowIdx = positions[i];
                const z = (val - mean) / stdDev;

                if (Math.abs(z) > 3) {
                    outliers.push({ row: rowIdx, value: val, zScore: z });
                    cleanedData[rowIdx][col] = null;
                }
            }

            totalOutliers += outliers.length;

            if (outliers.length > 0) {
                const colName = headers[col] || `Column ${col + 1}`;
                columnResults.push({
                    name: colName,
                    outlierCount: outliers.length,
                    mean: mean,
                    stdDev: stdDev
                });
            }
        }

        DataStore.currentData = cleanedData;
        DataStore.operations.push("Detect Outliers");

        // Save results for reuse
        if (!DataStore.cleaningResults) DataStore.cleaningResults = {};
        DataStore.cleaningResults.detectOutliersResults = {
            columnResults: columnResults,
            totalOutliers: totalOutliers
        };

        UIController.displayOutlierResults(columnResults, totalOutliers);

        document.getElementById('cleaning-results').innerHTML +=
            `<p>Current data: ${cleanedData.length} rows (Original: ${DataStore.originalData.length} rows)<br>` +
            `Applied operations: ${DataStore.operations.join(", ")}</p>`;
    }
};

window.DataCleaner = DataCleaner;
