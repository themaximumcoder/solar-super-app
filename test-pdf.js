const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'C:/Users/banan/.gemini/antigravity/brain/d3a59669-4536-4d42-94ed-6bc6fe43159b/media__1781768803156.pdf';
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log(data.text);
});
