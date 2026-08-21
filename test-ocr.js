const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

async function testOCR() {
    const imagePath = path.join('C:\\Users\\banan\\.gemini\\antigravity\\brain\\d3a59669-4536-4d42-94ed-6bc6fe43159b', 'media__1781835271604.jpg');
    console.log("Running Tesseract on rotated image...");
    try {
        const buffer = await sharp(imagePath).rotate(90).toBuffer();
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        console.log("Extracted text:\n", text);
        const matches = text.match(/[A-Z0-9]{10,}/g);
        console.log("Matched Serials:", matches);
    } catch (e) {
        console.error("Error:", e);
    }
}

testOCR();
