import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

export async function POST(req: Request) {
  try {
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

    // Try up to 4 rotations (0, 90, 180, 270) to find serial numbers
    const angles = [0, 90, 180, 270];
    for (const angle of angles) {
        let rotatedBuffer: any = buffer;
        if (angle !== 0) {
            rotatedBuffer = await sharp(buffer).rotate(angle).toBuffer();
        }

        const { data: { text } } = await Tesseract.recognize(rotatedBuffer, 'eng');
        fullText += " " + text;

        if (ocrType === 'serial') {
            const cleanedText = text.replace(/\s+/g, '');
            if (/[A-Z0-9]{10,}/.test(cleanedText)) {
                // Found a serial! No need to try other rotations.
                break;
            }
        } else {
            // For voltage, try to find voltage
            const match = text.match(/(\d{2,3}(?:\.\d)?)/);
            if (match) {
                maxVal = match[1];
                break;
            }
        }
    }

    return NextResponse.json({ voltage: maxVal, text: fullText });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process image', details: error.message }, { status: 500 });
  }
}
