import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ocrType = formData.get('type') as string; // 'voltage' or 'serial'
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let buffer: any = Buffer.from(arrayBuffer);

    // Auto-rotate based on EXIF to fix basic mobile phone rotation issues
    buffer = await sharp(buffer).rotate().toBuffer();

    let fullText = '';
    let maxVal = '';

    if (ocrType === 'serial') {
        // Try up to 4 rotations (0, 90, 180, 270) to find serial numbers
        const angles = [0, 90, 180, 270];
        for (const angle of angles) {
            let rotatedBuffer: any = buffer;
            if (angle !== 0) {
                rotatedBuffer = await sharp(buffer).rotate(angle).toBuffer();
            }

            const { data: { text } } = await Tesseract.recognize(rotatedBuffer, 'eng');
            fullText += " " + text;

            const cleanedText = text.replace(/[\s_]+/g, '');
            if (/[a-zA-Z0-9-]{10,}/.test(cleanedText)) {
                // Found a serial! No need to try other rotations.
                break;
            }
        }
    } else {
        // MULTIMETER (VOLTAGE) LOGIC via GEMINI
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imageParts = [
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type || "image/jpeg"
                }
            }
        ];
        
        const prompt = "What is the number displayed on the main digital LCD screen of this multimeter? Look very carefully at the seven-segment digital display. Return ONLY the exact number shown, without any units or extra text. (For example, if the screen shows '241', return '241').";
        
        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text();
        
        // Clean up response to just numbers and decimals
        maxVal = responseText.replace(/[^\d.]/g, '').trim();
        fullText = responseText;
    }

    return NextResponse.json({ voltage: maxVal, text: fullText });
  } catch (error: any) {
    console.error('OCR Error:', error);
        return NextResponse.json({ error: 'Failed to process image', details: error.message || 'Unknown error' }, { status: 500 });
    }
}
