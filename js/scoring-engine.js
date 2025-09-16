const ScoringEngine = {
    analyzeDataQuality: function () {
        const data = DataStore.originalData;

        if (!data || data.length === 0) return { error: "File is empty" };
        if (data.length === 1) return { error: "Only one row, unable to analyze" };

        const headers = data[0];
        const dataRows = data.slice(1);

        const normalizedRows = dataRows;

        const uniquenessScore = ScoringEngine.calculateUniqueness(normalizedRows, headers);
        const { score: completenessScore, columnScores: columnCompleteness } = ScoringEngine.calculateCompleteness(normalizedRows, headers);
        const { score: accuracyScore, columnScores: columnAccuracy } = ScoringEngine.calculateAccuracy(normalizedRows, headers);
        const { score: consistencyScore, columnScores: columnConsistency } = ScoringEngine.calculateConsistency(normalizedRows, headers);

        let total = 0, valid = 0;
        if (uniquenessScore !== null) { total += uniquenessScore; valid++; }
        if (completenessScore !== null) { total += completenessScore; valid++; }
        if (accuracyScore !== null) { total += accuracyScore; valid++; }
        if (consistencyScore !== null) { total += consistencyScore; valid++; }

        const overallScore = valid > 0 ? total / valid : 0;

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

    calculateUniqueness: function (rows, headers) {
        const seen = new Set(rows.map(r => JSON.stringify(r)));
        return Math.round((seen.size / rows.length) * 100);
    },

    calculateCompleteness: function (rows, headers) {
        const columnScores = {};
        const rates = [];

        headers.forEach((h, j) => {
            let missing = 0;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i][j] === "" || rows[i][j] === null) missing++;
            }
            const rate = (1 - missing / rows.length) * 100;
            columnScores[h] = Math.round(rate);
            rates.push(rate);
        });

        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.min(...rates);
        const score = avg * Math.sqrt(min / 100);

        return { score: Math.round(score), columnScores };
    },

    calculateAccuracy: function (rows, headers) {
        const columnScores = {};
        const rates = [];

        for (let j = 0; j < headers.length; j++) {
            const vals = [];
            let isNumeric = true;

            for (let i = 0; i < rows.length; i++) {
                const v = rows[i][j];
                if (v === "" || v === null) continue;

                const num = parseFloat(String(v).trim());
                if (isNaN(num)) { isNumeric = false; break; }
                vals.push(num);
            }

            if (!isNumeric || vals.length === 0) continue;

            const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
            const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
            const std = Math.sqrt(variance);

            const outliers = vals.filter(v => v < mean - 3 * std || v > mean + 3 * std);
            const columnScore = ((vals.length - outliers.length) / vals.length) * 100;

            columnScores[headers[j]] = Math.round(columnScore);
            rates.push(columnScore);
        }

        if (rates.length === 0) return { score: null, columnScores: {} };

        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.min(...rates);
        const score = avg * Math.sqrt(min / 100);

        return { score: Math.round(score), columnScores };
    },

    calculateConsistency: function (rows, headers) {
        const columnScores = {};
        const rates = [];

        for (let j = 0; j < headers.length; j++) {
            const typeCount = { numeric: 0, text: 0, date: 0, boolean: 0 };
            let nonEmpty = 0;

            for (let i = 0; i < rows.length; i++) {
                const v = rows[i][j];
                if (v === "" || v === null) continue;

                nonEmpty++;
                const valStr = String(v).trim();

                if (["true", "false", "yes", "no"].includes(valStr.toLowerCase())) {
                    typeCount.boolean++;
                } else if (valStr.includes("/") || valStr.includes("-")) {
                    if (/[0-9]/.test(valStr)) typeCount.date++;
                    else typeCount.text++;
                } else {
                    if (!isNaN(parseFloat(valStr))) typeCount.numeric++;
                    else typeCount.text++;
                }
            }

            let columnScore;
            if (nonEmpty === 0) {
                columnScore = 100;
            } else {
                const maxCount = Math.max(...Object.values(typeCount));
                columnScore = (maxCount / nonEmpty) * 100;
            }

            columnScores[headers[j]] = Math.round(columnScore);
            rates.push(columnScore);
        }

        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.min(...rates);
        const score = avg * Math.sqrt(min / 100);

        return { score: Math.round(score), columnScores };
    }
};
