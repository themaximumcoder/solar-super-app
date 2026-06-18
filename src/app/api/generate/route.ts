import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const templatePath = path.join(process.cwd(), 'public', 'template.docx');
    if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: 'Template file not found on server.' }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const opts = {
      centered: false,
      getImage: (tagValue: string, tagName: string) => {
        if (!tagValue || !tagValue.includes('base64,')) {
           return Buffer.from(""); 
        }
        const base64Data = tagValue.split('base64,')[1];
        return Buffer.from(base64Data, 'base64');
      },
      getSize: (img: any, tagValue: string, tagName: string) => {
        return [400, 300]; // Fixed dimensions for uniformity in the report
      }
    };
    
    const imageModule = new ImageModule(opts);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule]
    });

    doc.render(data);

    const buf = doc.getZip().generate({
      type: 'arraybuffer',
      compression: 'DEFLATE',
    });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Site_Acceptance_Report.docx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating document:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate document' }, { status: 500 });
  }
}
