import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (typeof global.DOMMatrix === 'undefined') {
      (global as any).DOMMatrix = class DOMMatrix {};
    }
    const pdf = require('pdf-parse');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Limit parsing to the first page to save memory and time as requested
    const data = await pdf(buffer, { max: 1 });
    const text = data.text;

    // Extract fields based on OCR format provided by user:
    // "Order ID: MHS_6390"
    const mhsMatch = text.match(/Order ID:\s*(MHS_\d+)/i) || text.match(/(MHS_\d+)/i);
    const mhs = mhsMatch ? mhsMatch[1] : '';

    // "Customer’s Full Name\nPOH SIN KHEONG"
    const nameMatch = text.match(/Customer.s Full Name\s*\n\s*(.*)/i);
    const name = nameMatch ? nameMatch[1].trim() : '';

    // "Installation Address:\n4, JALAN SS 2/96, SS 2, PETALING JAYA, SELANGOR, 47300, MALAYSIA"
    const addressMatch = text.match(/Installation Address:\s*\n\s*(.*)/i);
    const address = addressMatch ? addressMatch[1].trim() : '';

    // "12.4 kWp"
    const sizeMatch = text.match(/(\d+\.\d+)\s*kWp/i);
    const size = sizeMatch ? sizeMatch[1].trim() : '';

    return NextResponse.json({ mhs, name, address, size, success: true });
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse PDF', details: error.message }, { status: 500 });
  }
}
