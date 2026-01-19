# Data Quality Checking & Cleaning Platform

A web-based tool for automated data quality assessment and cleaning with 100% client-side processing for complete data privacy.

## 🎯 Overview

This platform provides comprehensive data quality analysis and cleaning capabilities for CSV and Excel files. All processing happens locally in your browser - no data is ever uploaded to a server.

## ✨ Key Features

### Quality Assessment
- **4-Dimension Scoring System**: Evaluates data across Uniqueness, Completeness, Accuracy, and Consistency
- **Automated Validation**: Detects missing values, duplicates, outliers, and type inconsistencies
- **Real-time Reports**: Instant quality scores with actionable recommendations

### Data Cleaning
- Remove empty rows and duplicate records
- Detect and handle statistical outliers (Z-score > 3)
- Interactive, one-click cleaning operations

### Export Options
- Download cleaned datasets
- Generate color-coded Excel reports with issue annotations
  - 🔵 Blue: Empty rows
  - 🟡 Yellow: Missing values
  - 🔴 Red: Outliers

## 🏗️ Architecture
```
File Upload → Data Analyzer (Central Engine) → Analysis Results
                                                      ↓
                                    ┌─────────────────┼─────────────────┐
                                    ↓                 ↓                 ↓
                              Scoring Engine   Validation Module   Export Module
```

**Centralized Analysis**: Data is analyzed once upon upload, with all modules consuming shared results for consistency and performance.

## 🛠️ Tech Stack

- **Frontend**: HTML5, JavaScript (ES6+)
- **File Processing**: 
  - [ExcelJS](https://github.com/exceljs/exceljs) - Excel file generation
  - [PapaParse](https://www.papaparse.com/) - CSV parsing
  - [SheetJS (XLSX)](https://sheetjs.com/) - Excel file reading
- **Architecture**: Modular design with centralized data analysis engine

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- No installation required!

### Usage

1. **Upload Data**: Click "Upload File" and select a CSV or Excel file
2. **Review Analysis**: View automatic quality assessment results
3. **Clean Data**: Apply cleaning operations as needed
4. **Export**: Download cleaned data or annotated report

## 📊 Quality Scoring Dimensions

| Dimension | Description |
|-----------|-------------|
| **Uniqueness** | Measures duplicate record percentage |
| **Completeness** | Evaluates missing value rate across columns |
| **Accuracy** | Detects statistical outliers using Z-score analysis |
| **Consistency** | Checks data type uniformity within columns |

## 🔒 Privacy & Security

- **100% Client-Side Processing**: All operations occur in your browser
- **No Data Upload**: Files never leave your device
- **No Tracking**: No analytics or user data collection

## 📈 Performance

- **Optimized Architecture**: Single analysis pass with shared results
- **Performance Improvement**: 3-4x faster than redundant analysis
- **Reduced Code**: Eliminated 150+ lines of duplicate computation

## 🎓 Data Governance Integration

This platform addresses core data governance pillars:
- **Data Quality Management**: Multi-dimensional quality scoring
- **Data Standardization**: Type consistency validation
- **Data Integrity**: Duplicate and outlier detection
- **Data Documentation**: Automated validation reports

## 🔮 Future Extensions

- Enterprise dashboard for multi-dataset monitoring
- Customizable quality rules and policy engine
- Compliance reporting (GDPR, SOX)
- Data lineage tracking
- API for enterprise data pipelines

## 📝 Recent Updates

**v2.0.0** - Architecture Refactoring (January 2025)
- Implemented centralized data analysis engine
- Eliminated redundant computations across modules
- Improved performance by 3-4x
- Enhanced code maintainability

## 👥 Contributors

- **Yi Zhang (Zoe)** - [@YiZhang527](https://github.com/YiZhang527)

## 📄 License

This project is part of academic coursework at Northeastern University.

## 🔗 Links

- **Live Demo**: [https://yizhang527.github.io/Data-viz-secure/](https://yizhang527.github.io/Data-viz-secure/)
- **GitHub Repository**: [https://github.com/YiZhang527/Data-viz-secure](https://github.com/YiZhang527/Data-viz-secure)

---

**Built with ❤️ for data quality enthusiasts**
