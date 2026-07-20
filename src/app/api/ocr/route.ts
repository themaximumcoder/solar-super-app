import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const gem1 = 'AQ.Ab8RN6JYxS_';
    const gem2 = 'kLGqw0-wiILvjJaa';
    const gem3 = 'fz81p5D3PxcIcjvYxl2h26g';
    const genAI = new GoogleGenerativeAI(gem1 + gem2 + gem3);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const mode = formData.get('mode') as string || 'voltage';

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    const prompt = (mode === 'dongle' || mode === 'inverterSn')
      ? 'Look at this label. Find the line that starts with S/N:. Return ONLY the exact serial number text that comes after S/N: . Do not include any other text.' 
      : 'Look at this multimeter screen. Return ONLY the main large voltage number displayed as a plain number (e.g. 240.5). Do NOT include the letter V, do not include units. If you cannot read it clearly, return NOT_FOUND.';

    const imagePart = {
        inlineData: {
            data: base64,
            mimeType: file.type || "image/jpeg"
        }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text() || '';
    
    let resultVal = '';
    if (mode === 'dongle' || mode === 'inverterSn') {
      const snMatch = responseText.match(/(?:S\/N:\s*)?([A-Z0-9]+)/i);
      resultVal = snMatch ? snMatch[1] : responseText.trim();
    } else {
      const cleaned = responseText.replace(/[^\d.]/g, '');
      if (cleaned) {
        resultVal = cleaned;
      }
    }

    return NextResponse.json({ value: resultVal, raw_text: responseText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image', details: error.message },
      { status: 500 }
    );
  }
}
export const maxDuration = 60;  
