/**
 * data-analyzer.js
 * Central data analysis engine - performs all data quality analysis once
 * All other modules consume results from DataStore.analysisResults
 */

const DataAnalyzer = {
    
    analyze: function() {
        const data = DataStore.originalData;
        
        if (!data || data.length === 0) {
            return;
        }
        
        if (data.length === 1) {
            return;
        }
        
        const headers = data[0];
        const rows = data.slice(1);
        
        const results = {
            overall: this._analyzeOverall(rows, headers),
            columns: this._analyzeColumns(rows, headers),
            cellIssues: {}
        };
        
        this._buildCellIssueMap(results, rows, headers);
        
        DataStore.analysisResults = results;
    },
    
    /**
     * Analyze overall dataset statistics
     * @private
     */
    _analyzeOverall: function(rows, headers) {
        const emptyRowIndices = [];
        const duplicateRowIndices = [];
        
        for (let i = 0; i < rows.length; i++) {
            if (this._isEmptyRow(rows[i])) {
                emptyRowIndices.push(i + 1);
            }
        }
        
        const seen = new Map();
        for (let i = 0; i < rows.length; i++) {
            const rowStr = JSON.stringify(rows[i]);
            if (seen.has(rowStr)) {
                duplicateRowIndices.push(i + 1);
            } else {
                seen.set(rowStr, i + 1);
            }
        }
        
        return {
            totalRows: rows.length,
            totalColumns: headers.length,
            emptyRowIndices: emptyRowIndices,
            duplicateRowIndices: duplicateRowIndices,
            hasIssues: emptyRowIndices.length > 0 || duplicateRowIndices.length > 0
        };
    },
    
    /**
     * Analyze each column
     * @private
     */
    _analyzeColumns: function(rows, headers) {
        const columnResults = {};
        
        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            const columnName = headers[colIndex];
            const columnData = rows.map(row => row[colIndex]);
            
            const typeResult = this._detectDataType(columnData);
            
            let stats = null;
            if (typeResult.type === "numeric") {
                stats = this._calculateStats(columnData);
            }
            
            const quality = this._analyzeColumnQuality(columnData, stats, colIndex, rows);
            
            columnResults[columnName] = {
                index: colIndex,
                dataType: typeResult.type,
                typeDistribution: typeResult.typeDistribution,
                stats: stats,
                quality: quality
            };
        }
        
        return columnResults;
    },
    
    /**
     * Detect the data type of a column and return type distribution
     * @private
     */
    _detectDataType: function(columnData) {
        const typeCount = { numeric: 0, text: 0, date: 0, boolean: 0, empty: 0 };
        
        for (let value of columnData) {
            if (this._isMissing(value)) {
                typeCount.empty++;
                continue;
            }
            
            const valStr = String(value).trim();
            
            if (["true", "false", "yes", "no"].includes(valStr.toLowerCase())) {
                typeCount.boolean++;
            } else if ((valStr.includes("/") || valStr.includes("-")) && /[0-9]/.test(valStr)) {
                typeCount.date++;
            } else if (this._isNumeric(value)) {
                typeCount.numeric++;
            } else {
                typeCount.text++;
            }
        }
        
        const totalValues = columnData.length;
        const nonEmptyCount = totalValues - typeCount.empty;
        
        // Remove empty from distribution (only keep actual types)
        const distribution = {
            numeric: typeCount.numeric,
            text: typeCount.text,
            date: typeCount.date,
            boolean: typeCount.boolean
        };
        
        // Determine dominant type
        if (nonEmptyCount === 0) {
            return {
                type: null,
                typeDistribution: distribution
            };
        }
        
        let detectedType = null;
        let maxCount = 0;
        
        for (let [type, count] of Object.entries(distribution)) {
            if (count > maxCount) {
                maxCount = count;
                detectedType = type;
            }
        }
        
        // Check if mixed (has multiple types)
        let typesPresent = 0;
        for (let count of Object.values(distribution)) {
            if (count > 0) typesPresent++;
        }
        
        if (typesPresent > 1) {
            detectedType = "mixed";
        }
        
        return {
            type: detectedType,
            typeDistribution: distribution
        };
    },
    
    /**
     * Calculate statistics for numeric column
     * @private
     */
    _calculateStats: function(columnData) {
        const numericValues = [];
        
        for (let value of columnData) {
            if (this._isNumeric(value)) {
                numericValues.push(Number(value));
            }
        }
        
        if (numericValues.length === 0) {
            return null;
        }
        
        const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        const squaredDiffs = numericValues.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / numericValues.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            mean: mean,
            stdDev: stdDev,
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            count: numericValues.length
        };
    },
    
    /**
     * Analyze quality issues in a column
     * @private
     */
    _analyzeColumnQuality: function(columnData, stats, colIndex, rows) {
        const missingIndices = [];
        const outlierIndices = [];
        const outlierDetails = [];
        
        for (let i = 0; i < columnData.length; i++) {
            if (this._isMissing(columnData[i])) {
                missingIndices.push(i + 1);
            }
        }
        
        if (stats && stats.stdDev > 0) {
            for (let i = 0; i < columnData.length; i++) {
                const value = columnData[i];
                if (this._isNumeric(value)) {
                    const numValue = Number(value);
                    const zScore = (numValue - stats.mean) / stats.stdDev;
                    
                    if (Math.abs(zScore) > 3) {
                        const rowIndex = i + 1;
                        outlierIndices.push(rowIndex);
                        outlierDetails.push({
                            row: rowIndex,
                            value: numValue,
                            zScore: zScore
                        });
                    }
                }
            }
        }
        
        return {
            missingCount: missingIndices.length,
            missingIndices: missingIndices,
            outlierCount: outlierIndices.length,
            outlierIndices: outlierIndices,
            outlierDetails: outlierDetails
        };
    },
    
    /**
     * Build cell-level issue map
     * @private
     */
    _buildCellIssueMap: function(results, rows, headers) {
        for (let [colName, colData] of Object.entries(results.columns)) {
            const colIndex = colData.index;
            
            for (let rowIndex of colData.quality.missingIndices) {
                const key = `${rowIndex},${colIndex}`;
                results.cellIssues[key] = "missing";
            }
            
            for (let rowIndex of colData.quality.outlierIndices) {
                const key = `${rowIndex},${colIndex}`;
                results.cellIssues[key] = "outlier";
            }
        }
    },
    
    /**
     * Check if a row is empty
     * @private
     */
    _isEmptyRow: function(row) {
        return row.every(cell => this._isMissing(cell));
    },
    
    /**
     * Check if a value is missing
     * @private
     */
    _isMissing: function(value) {
        return value === "" || value === null || value === undefined || 
               (typeof value === 'string' && value.trim() === "");
    },
    
    /**
     * Check if a value is numeric
     * @private
     */
    _isNumeric: function(value) {
        if (this._isMissing(value)) return false;
        const num = Number(value);
        return !isNaN(num) && isFinite(num);
    }
};

window.DataAnalyzer = DataAnalyzer;