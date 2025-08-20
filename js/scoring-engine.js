/**
 * scoring-engine.js
 * Data quality scoring engine with four-dimension analysis
 */
const ScoringEngine = {
    // Main analysis function
    analyzeDataQuality: function(){
        console.log("Starting data quality analysis");

        // Get original data from DataStore
        const data = DataStore.originalData;

        // Check if data exists
        if(data.length === 0){
            return{ error: "File is empty" };
        }

        // Check if only one row exists
        if(data.length === 1){
            return{ error:"Only one row, unable to analyze" };
        }

        // Seperate headers and data rows
        const headers = data[0];
        const dataRows = data.slice(1);

        // Calculate four dimensions
        console.log("Calculating uniqueness...");

        // 1. Uniqueness - check duplicate rows
        const uniquenessScore = this.calculateUniqueness(dataRows);

        // 2. Completeness - check missing values
        const completenessScore = this.calculateCompleteness(dataRows);

        // 3. Accuracy - check outliers(numeric columns only)
        const accuracyScore = this.calculateAccuracy(dataRows);

        // 4. Consistency - check format patterns
        const consistencyScore = this.calculateConsistency(dataRows);

        // Calculate overall score
        let validDimensions = 0;
        let totalScore = 0;

        // Add uniqueness score if valid
        if(uniquenessScore !== null){
            totalScore += uniquenessScore;
            validDimensions++;
        }

        // Add Completeness score if valid
        if(completenessScore !== null){
            totalScore += completenessScore;
            validDimensions++;
        }

        // Add accuracy score if valid
        if(accuracyScore !== null){
            totalScore += accuracyScore;
            validDimensions++;
        }

        //Add consistency score if valid
        if(consistencyScore !== null){
            totalScore += consistencyScore;
            validDimensions++;
        }

        // Calculate average score
        const overallScore = validDimensions > 0 ? totalScore / validDimensions : 0;

        // Return results
        return{
            score: Math.round(overallScore)
        };

    }, // Main function ends

    // Calculate uniqueness score(duplicate detection)
    calculateUniqueness: function(dataRows){
        const totalRows = dataRows.length;
        const seen = new Set()

        for (let i = 0; i < dataRows.length; i++){
            seen.add(JSON.stringify(dataRows[i]));
        }

        const uniqueRows = seen.size
        const score = (uniqueRows / totalRows) * 100;

        return Math.round(score);
    }
}