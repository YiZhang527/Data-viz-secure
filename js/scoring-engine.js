/**
 * scoring-engine.js
 * JS Data Quality Scoring Engine
 * Fully aligned with Python logic
 */
const ScoringEngine = {
    analyzeDataQuality: function () {
        const data = DataStore.originalData;

        if (!data || data.length === 0) return { error: "File is empty" };
        if (data.length === 1) return { error: "Only one row, unable to analyze" };

        const headers = data[0];
        const dataRows = data.slice(1);

        // Normalize rows to match Python behavior
        const normalizedRows = dataRows.map(row => headers.map((_, j) => (row[j] !== undefined ? row[j] : "")));

        const uniquenessScore = ScoringEngine.calculateUniqueness(normalizedRows, headers);
        const { score: completenessScore, columnScores: columnCompleteness } = ScoringEngine.calculateCompleteness(normalizedRows, headers);
        const { score: accuracyScore, columnScores: columnAccuracy } = ScoringEngine.calculateAccuracy(normalizedRows, headers);
        const { score: consistencyScore, columnScores: columnConsistency } = ScoringEngine.calculateConsistency(normalizedRows, headers);

        // Calculate overall score
        let total = 0, valid = 0;
        if (uniquenessScore !== null) { total += uniquenessScore; valid++; }
        if (completenessScore !== null) { total += completenessScore; valid++; }
        if (accuracyScore !== null) { total += accuracyScore; valid++; }
        if (consistencyScore !== null) { total += consistencyScore; valid++; }

        const overallScore = valid > 0 ? total / valid : 0;

        return {
            score: Math.round(overallScore), // 网页显示用
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

            // 使用传统for循环，支持break
            for (let i = 0; i < rows.length; i++) {
                const v = rows[i][j];
                if (v === "" || v === null) continue;

                const num = parseFloat(String(v).trim());
                if (isNaN(num)) { isNumeric = false; break; }
                vals.push(num);
            }

            if (!isNumeric || vals.length === 0) continue;

            // mean & standard deviation
            const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
            const std = Math.sqrt(vals.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / vals.length);

            // detect outliers
            const outliers = vals.filter(x => x < mean - 3 * std || x > mean + 3 * std);
            const colScore = ((vals.length - outliers.length) / vals.length) * 100;

            columnScores[headers[j]] = Math.round(colScore);
            rates.push(colScore);
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
                const s = String(v).trim();

                if (['true','false','yes','no'].includes(s.toLowerCase())) typeCount.boolean++;
                else if (s.includes('/') || s.includes('-')) {
                    typeCount[/[0-9]/.test(s) ? 'date' : 'text']++;
                } else if (!isNaN(parseFloat(s)) && isFinite(parseFloat(s))) typeCount.numeric++;
                else typeCount.text++;
            }

            const colScore = nonEmpty === 0 ? 100 : (Math.max(...Object.values(typeCount)) / nonEmpty) * 100;
            columnScores[headers[j]] = Math.round(colScore);
            rates.push(colScore);
        }

        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const min = Math.min(...rates);
        const score = avg * Math.sqrt(min / 100);

        return { score: Math.round(score), columnScores };
    }
};
