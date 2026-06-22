import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParser = new PDFParser(null, true);
    
    return new Promise<NextResponse>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: any) => {
        resolve(NextResponse.json({ error: 'Failed to parse PDF', details: errData.parserError?.message || errData.message || 'Unknown error' }, { status: 500 }));
      });

      pdfParser.on("pdfParser_dataReady", pdfData => {
        const text = pdfParser.getRawTextContent();
        
        const mhsMatch = text.match(/(MHS_\d+)/i);
        const sizeMatch = text.match(/([\d\.]+\s*kWp)/i);
        const nameMatch = text.match(/Customer[’']?s Full Name\s*([\s\S]*?)\s*Installation Address/i);
        const addressMatch = text.match(/Installation Address:\s*([\s\S]*?)\s*Electricity Supply Phase/i);

        resolve(NextResponse.json({
          mhs: mhsMatch ? mhsMatch[1] : '',
          size: sizeMatch ? sizeMatch[1] : '',
          address: addressMatch ? addressMatch[1].trim() : '',
          name: nameMatch ? nameMatch[1].trim() : '',
        }));
      });

      pdfParser.parseBuffer(buffer);
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to parse PDF', details: error.message }, { status: 500 });
  }
}
