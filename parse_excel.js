const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('src/MAXIS_Huawei Inverter Residential Subcon BQ and BOM list (new) (Autosaved).xlsx');
const sheetName = workbook.SheetNames[0]; // Assuming it's the first sheet
const sheet = workbook.Sheets[sheetName];

// Convert to 2D array
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// We want to look up Row 6 (index 5) for number of PVs.
const pvRow = data[5];

const specsMap = {};

// Scan the pvRow to find columns that have a number
for (let colIndex = 0; colIndex < pvRow.length; colIndex++) {
    const cellValue = pvRow[colIndex];
    
    // Check if it's a valid number (e.g., 10, 11, 12, 13)
    if (typeof cellValue === 'number' || (!isNaN(cellValue) && cellValue !== null && cellValue !== '')) {
        const numPV = parseInt(cellValue);
        
        // Extract rows 7 to 14 (indexes 6 to 13) for this column
        const specs = [];
        for (let r = 6; r <= 13; r++) {
            if (data[r] && data[r][colIndex]) {
                specs.push(data[r][colIndex]);
            } else {
                specs.push(""); // empty if undefined
            }
        }
        
        specsMap[numPV] = specs;
    }
}

console.log(JSON.stringify(specsMap, null, 2));
fs.writeFileSync('src/data/pvSpecs.json', JSON.stringify(specsMap, null, 2));
console.log("Extracted specs to src/data/pvSpecs.json!");
