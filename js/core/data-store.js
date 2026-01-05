// Global DataStore for sharing data between modules
const DataStore = {
    originalData: null,  // Original data from the file (remains unchanged)
    currentData: null,   // Current data after all applied operations
    operations: [],      // List of applied operations
    currentFile: null    // Current file object
};