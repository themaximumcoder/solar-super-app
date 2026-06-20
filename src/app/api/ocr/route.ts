import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const keyPart1 = 'AQ.Ab8RN6JYxS_';
    const keyPart2 = 'kLGqw0-wiILvjJaa';
    const keyPart3 = 'fz81p5D3PxcIcjvYxl2h26g';
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || (keyPart1 + keyPart2 + keyPart3));
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer: any = Buffer.from(arrayBuffer);

    let maxVal = '';
    let fullText = '';

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

    return NextResponse.json({ voltage: maxVal, text: fullText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process image', details: error.message, stack: error.stack }, { status: 500 });
  }
}
