const ScoringEngine = {
    analyzeDataQuality: function () {
        const analysisResults = DataStore.analysisResults;

        if (!analysisResults) return { error: "No analysis results available" };

        const uniquenessScore = ScoringEngine.calculateUniqueness();
        const { score: completenessScore, columnScores: columnCompleteness } = ScoringEngine.calculateCompleteness();
        const { score: accuracyScore, columnScores: columnAccuracy } = ScoringEngine.calculateAccuracy();
        const { score: consistencyScore, columnScores: columnConsistency } = ScoringEngine.calculateConsistency();

        let validDimensions = 0;
        let totalScore = 0;
        const scores = [];

        if (uniquenessScore !== null) {
            totalScore += uniquenessScore;
            validDimensions++;
            scores.push(uniquenessScore);
        }
        if (completenessScore !== null) {
            totalScore += completenessScore;
            validDimensions++;
            scores.push(completenessScore);
        }
        if (accuracyScore !== null) {
            totalScore += accuracyScore;
            validDimensions++;
            scores.push(accuracyScore);
        }
        if (consistencyScore !== null) {
            totalScore += consistencyScore;
            validDimensions++;
            scores.push(consistencyScore);
        }

        const baseScore = validDimensions > 0 ? totalScore / validDimensions : 0;
        let overallScore;
        
        if (scores.length > 0) {
            const minScore = Math.min(...scores);
            let penalty;
            if (minScore < 30) {
                penalty = 0.7;
            } else if (minScore < 60) {
                penalty = 0.8;
            } else {
                penalty = 1;
            }
            overallScore = baseScore * penalty;
        } else {
            overallScore = 0;
        }

        return {
            score: Math.round(overallScore),
            dimensions: {
                uniqueness: uniquenessScore,
                completeness: completenessScore,
                accuracy: accuracyScore,
                consistency: consistencyScore
            },
            columnScores: {
                uniqueness: null,
                completeness: columnCompleteness,
                accuracy: columnAccuracy,
                consistency: columnConsistency
            }
        };
    },

    calculateUniqueness: function () {
        const analysisResults = DataStore.analysisResults;
        const totalRows = analysisResults.overall.totalRows;
        const duplicateCount = analysisResults.overall.duplicateRowIndices.length;
        const uniqueRows = totalRows - duplicateCount;
        
        return Math.round((uniqueRows / totalRows) * 100);
    },

    calculateCompleteness: function () {
        const analysisResults = DataStore.analysisResults;
        const columns = analysisResults.columns;
        const totalRows = analysisResults.overall.totalRows;
        
        const columnScores = {};
        const rates = [];

        for (let [colName, colData] of Object.entries(columns)) {
            const missingCount = colData.quality.missingCount;
            const rate = (1 - missingCount / totalRows) * 100;
            columnScores[colName] = Math.round(rate);
            rates.push(rate);
        }

        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.min(...rates);
        const score = avg * Math.sqrt(min / 100);

        return { score: Math.round(score), columnScores };
    },

    calculateAccuracy: function () {
        const analysisResults = DataStore.analysisResults;
        const columns = analysisResults.columns;
        
        const columnScores = {};
        const rates = [];

        for (let [colName, colData] of Object.entries(columns)) {
            if (colData.stats === null) continue;
            
            const stats = colData.stats;
            const outlierCount = colData.quality.outlierCount;
            const totalNumeric = stats.count;
            
            const columnScore = ((totalNumeric - outlierCount) / totalNumeric) * 100;
            columnScores[colName] = Math.round(columnScore);
            rates.push(columnScore);
        }

        if (rates.length === 0) return { score: null, columnScores: {} };

        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.min(...rates);
        const score = avg * Math.sqrt(min / 100);

        return { score: Math.round(score), columnScores };
    },

    calculateConsistency: function () {
        const analysisResults = DataStore.analysisResults;
        const columns = analysisResults.columns;
        const totalRows = analysisResults.overall.totalRows;
        
        const columnScores = {};
        const rates = [];

        for (let [colName, colData] of Object.entries(columns)) {
            const missingCount = colData.quality.missingCount;
            const nonEmpty = totalRows - missingCount;
            
            let columnScore;
            if (nonEmpty === 0) {
                columnScore = 100;
            } else {
                const typeDistribution = colData.typeDistribution;
                const maxCount = Math.max(...Object.values(typeDistribution));
                columnScore = (maxCount / nonEmpty) * 100;
            }

            columnScores[colName] = Math.round(columnScore);
            rates.push(columnScore);
        }

        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.min(...rates);
        const score = avg * Math.sqrt(min / 100);

        return { score: Math.round(score), columnScores };
    }
};