const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser(this, 1); // 1 = raw text
const pdfPath = 'C:/Users/banan/.gemini/antigravity/brain/d3a59669-4536-4d42-94ed-6bc6fe43159b/media__1781768803156.pdf';

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    const text = pdfParser.getRawTextContent();
    
    const mhsMatch = text.match(/(MHS_\d+)/i);
    const sizeMatch = text.match(/([\d\.]+\s*kWp)/i);
    const nameMatch = text.match(/Customer[’']?s Full Name(.*?)Order ID/i);
    const addressMatch = text.match(/Installation Address:(.*?)(?:\n|\r|Customer)/i);

    console.log("MHS:", mhsMatch ? mhsMatch[1] : "NOT FOUND");
    console.log("Size:", sizeMatch ? sizeMatch[1] : "NOT FOUND");
    console.log("Name:", nameMatch ? nameMatch[1].trim() : "NOT FOUND");
    console.log("Address:", addressMatch ? addressMatch[1].trim() : "NOT FOUND");
});

pdfParser.loadPDF(pdfPath);
