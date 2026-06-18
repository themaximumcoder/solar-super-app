import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run Tesseract OCR on the image buffer
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');

    // Basic regex to find the first likely voltage number (e.g., 230, 240.5, 394)
    // We look for a sequence of 2 or 3 digits, optionally followed by a decimal point and one digit
    const match = text.match(/(\d{2,3}(?:\.\d)?)/);
    const maxVal = match ? match[1] : '';

    return NextResponse.json({ voltage: maxVal, text });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process image', details: error.message }, { status: 500 });
  }
}
